#requires -Version 5.1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backupRoot = Join-Path $root '_private_local\backups'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dest = Join-Path $backupRoot $stamp
New-Item -ItemType Directory -Path $dest -Force | Out-Null

$jsonSrc = Join-Path $root 'data\formations.json'
$jsonDst = Join-Path $dest 'formations.json'
Copy-Item $jsonSrc $jsonDst

$scriptsSrc = Join-Path $root 'scripts'
$scriptsDst = Join-Path $dest 'scripts'
Copy-Item $scriptsSrc $scriptsDst -Recurse

Write-Host "[REUSSITE] Sauvegarde créée." -ForegroundColor Green
Write-Host "  formations.json -> $jsonDst"
Write-Host "  scripts/        -> $scriptsDst"
Write-Host "Dossier : $dest"
