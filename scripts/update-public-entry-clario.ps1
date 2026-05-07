#requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string]$Code,
    [Parameter(Mandatory)] [string]$Id,
    [Parameter(Mandatory)] [string]$DescriptionCourte,
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$jsonPath = Join-Path $root 'data\formations.json'

function Stop-Err($m) { Write-Host "[ARRÊT] $m" -ForegroundColor Red; exit 1 }

if (-not (Test-Path $jsonPath)) { Stop-Err "data/formations.json introuvable" }

$raw = [System.IO.File]::ReadAllText($jsonPath, [System.Text.Encoding]::UTF8)
try { $data = $raw | ConvertFrom-Json } catch { Stop-Err "JSON invalide" }

# Recherche par Code ET Id
$matches = @($data | Where-Object { $_.code -eq $Code -and $_.id -eq $Id })
if ($matches.Count -eq 0) { Stop-Err "Aucune formation trouvée pour Code=$Code Id=$Id" }
if ($matches.Count -gt 1) { Stop-Err "Doublon détecté : $($matches.Count) entrées pour Code=$Code Id=$Id" }

# Refus contenu privé dans la nouvelle description
$forbidden = 'contenu privé','formation complète','texte client complet','accès privé','_private_local',
             'modules complets','exercices complets','livrable privé','html privé','markdown privé','fichier privé'
foreach ($f in $forbidden) {
    if ($DescriptionCourte -match [regex]::Escape($f)) {
        Stop-Err "Contenu privé détecté dans la description : '$f'"
    }
}

$entry = $matches[0]
$ancienne = $entry.description_courte

Write-Host ""
Write-Host "=== Mise à jour description_courte ===" -ForegroundColor Cyan
Write-Host "Code  : $Code"
Write-Host "Id    : $Id"
Write-Host "Titre : $($entry.titre)"
Write-Host ""
Write-Host "AVANT :" -ForegroundColor Yellow
Write-Host "  $ancienne"
Write-Host "APRÈS :" -ForegroundColor Yellow
Write-Host "  $DescriptionCourte"
Write-Host ""

if ($ancienne -eq $DescriptionCourte) {
    Write-Host "[INFO] Description identique. Aucune modification nécessaire." -ForegroundColor Yellow
    exit 0
}

if (-not $Apply) {
    Write-Host "[DRY-RUN] Aucune modification. Relancer avec -Apply pour appliquer." -ForegroundColor Yellow
    exit 0
}

# Apply : modifier l'objet dans la liste, ré-écrire
$entry.description_courte = $DescriptionCourte
$out = $data | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($jsonPath, $out, (New-Object System.Text.UTF8Encoding($false)))

# Validation post-écriture : relire et vérifier
$check = ([System.IO.File]::ReadAllText($jsonPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json)
$verify = @($check | Where-Object { $_.code -eq $Code -and $_.id -eq $Id })
if ($verify.Count -ne 1) { Stop-Err "Vérification post-écriture échouée (count=$($verify.Count))" }
if ($verify[0].description_courte -ne $DescriptionCourte) { Stop-Err "Description non mise à jour correctement" }

Write-Host "[REUSSITE] description_courte mise à jour pour $Code (aucun git)." -ForegroundColor Green
exit 0
