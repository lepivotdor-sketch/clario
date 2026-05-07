#requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string]$Code,
    [Parameter(Mandatory)] [string]$Titre,
    [Parameter(Mandatory)] [int]$Prix,
    [Parameter(Mandatory)] [string]$Categorie,
    [Parameter(Mandatory)] [string]$Niveau,
    [Parameter(Mandatory)] [string]$Duree,
    [string]$DescriptionPublique
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$baseUrl = 'https://lepivotdor-sketch.github.io/clario'

$errors = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

# Référentiels officiels (en dur, pas de lecture privée)
$prixOK = @(5,15,25,50,160,320)
$catsOK = @('IA','Productivité','Apprentissage','Business','Finances','Relations','Bonheur','Santé')
$forbidden = 'contenu privé','formation complète','texte client complet','accès privé','_private_local',
             'modules complets','exercices complets','livrable privé','html privé','markdown privé','fichier privé'

# 1. Validations de base
if ([string]::IsNullOrWhiteSpace($Code))   { $errors.Add("Code vide") }
if ([string]::IsNullOrWhiteSpace($Titre))  { $errors.Add("Titre vide") }
if ($prixOK -notcontains $Prix)            { $errors.Add("Prix non autorisé : $Prix (autorisés : $($prixOK -join ', '))") }
if ($catsOK -notcontains $Categorie)       { $errors.Add("Catégorie non officielle : '$Categorie' (autorisées : $($catsOK -join ', '))") }

# 2. Refus contenu privé dans titre / description
$blob = "$Titre $DescriptionPublique"
foreach ($f in $forbidden) {
    if ($blob -match [regex]::Escape($f)) { $errors.Add("Contenu privé détecté : '$f'") }
}

# 3. Slug propre depuis le titre
function ConvertTo-Slug([string]$text) {
    if (-not $text) { return '' }
    # Décomposer puis retirer les diacritiques
    $norm = $text.Normalize([System.Text.NormalizationForm]::FormD)
    $sb = New-Object System.Text.StringBuilder
    foreach ($ch in $norm.ToCharArray()) {
        $cat = [System.Globalization.CharUnicodeInfo]::GetUnicodeCategory($ch)
        if ($cat -ne [System.Globalization.UnicodeCategory]::NonSpacingMark) { [void]$sb.Append($ch) }
    }
    $clean = $sb.ToString().ToLowerInvariant()
    # Apostrophes typographiques et droites en espaces
    $clean = $clean -replace "[''’`]", ' '
    # Tout caractère non a-z0-9 devient un tiret
    $clean = $clean -replace '[^a-z0-9]+', '-'
    # Retirer les particules d'élision françaises isolées : l, d, c, j, t, s, m, n
    $particles = @('l','d','c','j','t','s','m','n')
    $segments = $clean.Split('-') | Where-Object { $_ -and ($particles -notcontains $_) }
    $clean = ($segments -join '-')
    # Nettoyer les doubles tirets et trim
    $clean = $clean -replace '-+', '-'
    return $clean.Trim('-')
}

$Slug = ConvertTo-Slug $Titre
if ([string]::IsNullOrWhiteSpace($Slug)) { $errors.Add("Slug vide après nettoyage du titre") }
elseif ($Slug -notmatch '^[a-z0-9](-?[a-z0-9]+)*$') { $errors.Add("Slug invalide : $Slug") }

# 4. Description Stripe courte (auto si non fournie)
$descStripe = if ($DescriptionPublique) {
    if ($DescriptionPublique.Length -gt 200) { $DescriptionPublique.Substring(0,197) + '...' } else { $DescriptionPublique }
} else {
    "Mini-formation Clario - $Titre - $Prix `$"
}

# 5. URLs Stripe
$successUrl = "$baseUrl/merci.html?id=$Slug"
$cancelUrl  = "$baseUrl/formation.html?id=$Slug"

# Sortie
Write-Host ""
Write-Host "=== Preparation entree publique Clario ===" -ForegroundColor Cyan
if ($errors.Count -gt 0) {
    Write-Host "[ECHEC] Validations :" -ForegroundColor Red
    foreach ($e in $errors) { Write-Host "  - $e" -ForegroundColor Red }
    exit 1
}

Write-Host "Code              : $Code"
Write-Host "Titre             : $Titre"
Write-Host "Slug genere       : $Slug"
Write-Host "Prix              : $Prix `$"
Write-Host "Categorie         : $Categorie"
Write-Host "Niveau            : $Niveau"
Write-Host "Duree             : $Duree"
Write-Host ""
Write-Host "--- URLs Stripe ---" -ForegroundColor Cyan
Write-Host "Success URL       : $successUrl"
Write-Host "Cancel URL        : $cancelUrl"
Write-Host "Description Stripe: $descStripe"
Write-Host ""
Write-Host "--- Commande dry-run prete (a remplir StripeLink reel) ---" -ForegroundColor Yellow
$descArg = if ($DescriptionPublique) { $DescriptionPublique } else { '<DESCRIPTION PUBLIQUE A FOURNIR>' }
$cmd = @"
powershell -ExecutionPolicy Bypass -File .\scripts\publish-formation-clario.ps1 ``
  -Code "$Code" -Id "$Slug" -Titre "$Titre" -Prix $Prix ``
  -Categorie "$Categorie" -Niveau "$Niveau" -Duree "$Duree" ``
  -DescriptionPublique "$descArg" ``
  -StripeLink "<https://buy.stripe.com/XXXXXXXXXXXXXXXXXXXX>"
"@
Write-Host $cmd
Write-Host ""
Write-Host "[OK] Preparation terminee. Aucun fichier modifie." -ForegroundColor Green
exit 0
