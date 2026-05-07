#requires -Version 5.1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$jsonPath = Join-Path $root 'data\formations.json'
$catPath  = Join-Path $root 'data\categories.json'
$prixPath = Join-Path $root 'data\prix.json'
$reportPath = Join-Path $root 'scripts\rapport-check.md'

$errors = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

function Read-Utf8Json($path) {
    $raw = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    return $raw | ConvertFrom-Json
}

# 1. Validité JSON
if (-not (Test-Path $jsonPath)) { $errors.Add("formations.json introuvable"); }
try { $data = Read-Utf8Json $jsonPath } catch { $errors.Add("JSON invalide : $_"); }

if ($errors.Count -eq 0) {
    # Référentiels
    $catsOK = (Read-Utf8Json $catPath).nom
    $prixOK = (Read-Utf8Json $prixPath).prix_numerique

    # 2. Champs obligatoires
    $required = 'id','code','titre','categorie','prix_numerique','stripe_link','slug','url'
    foreach ($f in $data) {
        foreach ($r in $required) {
            if (-not $f.$r) { $errors.Add("[$($f.code)] champ manquant : $r") }
        }
        # 3. Lien Stripe
        if ($f.stripe_link -and $f.stripe_link -notlike 'https://buy.stripe.com/*') {
            $errors.Add("[$($f.code)] lien Stripe invalide : $($f.stripe_link)")
        }
        # Catégorie officielle
        if ($f.categorie -and $catsOK -notcontains $f.categorie) {
            $errors.Add("[$($f.code)] catégorie non officielle : $($f.categorie)")
        }
        # Prix autorisé
        if ($f.prix_numerique -and $prixOK -notcontains $f.prix_numerique) {
            $errors.Add("[$($f.code)] prix non autorisé : $($f.prix_numerique)")
        }
    }

    # Doublons id / code
    $dupId   = $data | Group-Object id   | Where-Object Count -gt 1
    $dupCode = $data | Group-Object code | Where-Object Count -gt 1
    foreach ($g in $dupId)   { $errors.Add("doublon id : $($g.Name)") }
    foreach ($g in $dupCode) { $errors.Add("doublon code : $($g.Name)") }

    # 4. Sécurité contenu public — bloquant : vrais signaux dangereux
    $blocked = @(
        '_private_local','accès privé','texte client complet',
        'contenu pédagogique complet','exercices complets',
        'formation complète privée','livrable privé','html privé',
        'markdown privé','fichier privé'
    )
    $softBlocked = @('méthode complète','modules complets')
    $rawText = [System.IO.File]::ReadAllText($jsonPath, [System.Text.Encoding]::UTF8)
    foreach ($b in $blocked) {
        if ($rawText -match [regex]::Escape($b)) {
            $errors.Add("contenu sensible détecté : '$b'")
        }
    }
    foreach ($b in $softBlocked) {
        if ($rawText -match [regex]::Escape($b)) {
            $warnings.Add("expression à surveiller : '$b' (marketing OK, ne pas exposer le contenu réel)")
        }
    }
}

# 5. Rapport .md
$now = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$status = if ($errors.Count -eq 0) { 'RÉUSSITE' } else { 'ÉCHEC' }
$md = @()
$md += "# Rapport check-clario"
$md += ""
$md += "- Date : $now"
$md += "- Statut : **$status**"
$md += "- Erreurs : $($errors.Count)"
$md += "- Avertissements : $($warnings.Count)"
$md += ""
if ($errors.Count -gt 0) {
    $md += "## Erreurs"
    foreach ($e in $errors) { $md += "- $e" }
    $md += ""
}
if ($warnings.Count -gt 0) {
    $md += "## Avertissements"
    foreach ($w in $warnings) { $md += "- $w" }
}
[System.IO.File]::WriteAllLines($reportPath, $md, (New-Object System.Text.UTF8Encoding($false)))

# Sortie console
if ($errors.Count -eq 0) {
    Write-Host "[REUSSITE] data/formations.json OK pour publication." -ForegroundColor Green
    Write-Host "Rapport : scripts/rapport-check.md"
    exit 0
} else {
    Write-Host "[ECHEC] $($errors.Count) erreur(s) :" -ForegroundColor Red
    foreach ($e in $errors) { Write-Host "  - $e" -ForegroundColor Red }
    Write-Host "Rapport : scripts/rapport-check.md"
    exit 1
}
