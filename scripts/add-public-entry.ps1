#requires -Version 5.1
[CmdletBinding()]
param(
    [string]$Code,
    [string]$Id,
    [string]$Titre,
    [int]$Prix,
    [string]$Categorie,
    [string]$Niveau,
    [string]$Duree,
    [string]$DescriptionPublique,
    [string]$StripeLink,
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$jsonPath = Join-Path $root 'data\formations.json'
$catPath  = Join-Path $root 'data\categories.json'
$prixPath = Join-Path $root 'data\prix.json'

function Read-Utf8Json($p) { [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8) | ConvertFrom-Json }
function Ask($label, $current) { if ($current) { return $current } Read-Host $label }

$Code        = Ask 'Code (ex: IA-003)' $Code
$Id          = Ask 'Id / slug (ex: ia-titre-court)' $Id
$Titre       = Ask 'Titre' $Titre
if (-not $Prix) { $Prix = [int](Read-Host 'Prix numérique (5/15/25/50/160/320)') }
$Categorie   = Ask 'Catégorie' $Categorie
$Niveau      = Ask 'Niveau (micro/essentiel/approfondi/complet/premium/expert)' $Niveau
$Duree       = Ask 'Durée estimée' $Duree
$DescriptionPublique = Ask 'Description publique courte' $DescriptionPublique
$StripeLink  = Ask 'Stripe link (https://buy.stripe.com/...)' $StripeLink

$errors = New-Object System.Collections.Generic.List[string]

# Validations référentiels — catégories et prix autorisés
$catsOK = (Read-Utf8Json $catPath).nom
$prixOK = @(5,15,25,50,160,320)
if ($catsOK -notcontains $Categorie) { $errors.Add("Catégorie non autorisée : '$Categorie' (autorisées : $($catsOK -join ', '))") }
if ($prixOK -notcontains $Prix)      { $errors.Add("Prix non autorisé : $Prix (autorisés : $($prixOK -join ', '))") }

# Validation stricte du lien Stripe
$placeholders = @('', '#', 'TODO', 'stripe-link-a-ajouter')
$linkTrim = if ($StripeLink) { $StripeLink.Trim() } else { '' }
if ($placeholders -contains $linkTrim) {
    $errors.Add("Stripe link refusé : placeholder ou vide ('$linkTrim')")
} elseif ($linkTrim -notlike 'https://buy.stripe.com/*') {
    $errors.Add("Stripe link refusé : doit commencer par https://buy.stripe.com/")
} elseif ($linkTrim -match '(?i)test') {
    $errors.Add("Stripe link refusé : contient le mot 'test' (interdit en production)")
} else {
    $idPart = $linkTrim.Substring('https://buy.stripe.com/'.Length)
    if ($idPart.Length -lt 20) {
        $errors.Add("Stripe link refusé : identifiant trop court ($($idPart.Length) caractères, min 20)")
    }
}

# Unicité dans data/formations.json
$data = Read-Utf8Json $jsonPath
if ($data.code -contains $Code) { $errors.Add("Code déjà utilisé : $Code") }
if ($data.id   -contains $Id)   { $errors.Add("Id/slug déjà utilisé : $Id") }

# Refus contenu privé dans titre / description publique
$forbidden = 'contenu privé','formation complète','texte client complet','accès privé','_private_local'
$blob = "$Titre $DescriptionPublique"
foreach ($f in $forbidden) {
    if ($blob -match [regex]::Escape($f)) { $errors.Add("Contenu privé détecté dans titre/description : '$f'") }
}

if ($errors.Count -gt 0) {
    Write-Host "[ECHEC] Validation impossible :" -ForegroundColor Red
    foreach ($e in $errors) { Write-Host "  - $e" -ForegroundColor Red }
    exit 1
}

# Détecter prix_affiche depuis prix.json
$prixInfo = (Read-Utf8Json $prixPath) | Where-Object { $_.prix_numerique -eq $Prix }
$entry = [ordered]@{
    id            = $Id
    code          = $Code
    titre         = $Titre
    slug          = $Id
    url           = "formation.html?id=$Id"
    stripe_link   = $StripeLink
    success_url   = "merci.html?formation=$Id"
    categorie     = $Categorie
    prix_affiche  = $prixInfo.prix_affiche
    prix_numerique= $Prix
    niveau        = $Niveau
    duree_estimee = $Duree
    statut        = 'publié'
    description_courte = $DescriptionPublique
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " APERCU ENTREE PUBLIQUE — A AJOUTER A formations.json" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
$entry | ConvertTo-Json -Depth 4
Write-Host "==================================================" -ForegroundColor Cyan

if (-not $Apply) {
    Write-Host ""
    Write-Host "[DRY-RUN] Validations OK. Aucun fichier modifié." -ForegroundColor Yellow
    Write-Host "Pour appliquer : relancer avec -Apply" -ForegroundColor Yellow
    exit 0
}

# Apply : ajout puis ré-écriture en UTF-8 sans BOM
$dataList = [System.Collections.Generic.List[object]]::new()
foreach ($item in $data) { $dataList.Add($item) }
$dataList.Add([pscustomobject]$entry)
$out = $dataList | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($jsonPath, $out, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "[REUSSITE] Entrée ajoutée à data/formations.json (aucun git)." -ForegroundColor Green
