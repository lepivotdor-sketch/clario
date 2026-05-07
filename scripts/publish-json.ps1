#requires -Version 5.1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$jsonPath = Join-Path $root 'data\formations.json'
$backupDir = Join-Path $root '_archive\backups-formations'
$checkScript = Join-Path $PSScriptRoot 'check-clario.ps1'

# 1. Vérification obligatoire
& powershell -ExecutionPolicy Bypass -File $checkScript
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ANNULE] Vérification échouée. Publication interrompue." -ForegroundColor Red
    exit 1
}

# 2. Backup automatique
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = Join-Path $backupDir "formations-$stamp.json"
Copy-Item $jsonPath $backupPath
Write-Host "Backup : $backupPath" -ForegroundColor Cyan

# 3. Git — publication ciblée uniquement
Push-Location $root
try {
    git rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[INFO] Pas un dépôt Git. Backup créé, publication Git ignorée." -ForegroundColor Yellow
        exit 0
    }

    git add data/formations.json
    $staged = git diff --cached --name-only
    if (-not $staged) {
        Write-Host "[INFO] Aucun changement à publier." -ForegroundColor Yellow
        exit 0
    }

    $msg = "chore(data): mise à jour catalogue public ($stamp)"
    git commit -m $msg
    if ($LASTEXITCODE -ne 0) { throw "git commit a échoué" }

    git push origin main
    if ($LASTEXITCODE -ne 0) { throw "git push a échoué" }

    Write-Host "[REUSSITE] data/formations.json publié." -ForegroundColor Green
} finally {
    Pop-Location
}
