#requires -Version 5.1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backupRoot = Join-Path $root '_private_local\backups'
$jsonPath = Join-Path $root 'data\formations.json'

if (-not (Test-Path $backupRoot)) {
    Write-Host "[ECHEC] Aucun dossier de sauvegarde : $backupRoot" -ForegroundColor Red
    exit 1
}

$last = Get-ChildItem $backupRoot -Directory | Sort-Object Name -Descending | Select-Object -First 1
if (-not $last) {
    Write-Host "[ECHEC] Aucune sauvegarde trouvée." -ForegroundColor Red
    exit 1
}

$src = Join-Path $last.FullName 'formations.json'
if (-not (Test-Path $src)) {
    Write-Host "[ECHEC] formations.json absent dans : $($last.FullName)" -ForegroundColor Red
    exit 1
}

Write-Host "Dernière sauvegarde : $($last.Name)" -ForegroundColor Cyan
Write-Host "Source  : $src"
Write-Host "Cible   : $jsonPath"
$confirm = Read-Host "Restaurer ? (oui/non)"
if ($confirm -notmatch '^(oui|o|yes|y)$') {
    Write-Host "Annulé." -ForegroundColor Yellow
    exit 0
}

Copy-Item $src $jsonPath -Force
Write-Host "[REUSSITE] formations.json restauré depuis $($last.Name) (aucun git)." -ForegroundColor Green
