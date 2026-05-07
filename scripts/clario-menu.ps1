#requires -Version 5.1
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
function Run($file) { & powershell -ExecutionPolicy Bypass -File (Join-Path $here $file) }

while ($true) {
    Write-Host ""
    Write-Host "=== Menu Clario ===" -ForegroundColor Cyan
    Write-Host "1. Diagnostic complet (inventory + check)"
    Write-Host "2. Inventaire"
    Write-Host "3. Sauvegarde"
    Write-Host "4. Ajouter une entrée publique (dry-run)"
    Write-Host "5. Ajouter une entrée publique (Apply)"
    Write-Host "6. Tester le site live"
    Write-Host "7. Publier JSON seulement"
    Write-Host "8. Restaurer dernière sauvegarde"
    Write-Host "0. Quitter"
    $choice = Read-Host "Choix"

    switch ($choice) {
        '1' { Run 'inventory-clario.ps1'; Run 'check-clario.ps1' }
        '2' { Run 'inventory-clario.ps1' }
        '3' { Run 'backup-clario.ps1' }
        '4' { & powershell -ExecutionPolicy Bypass -File (Join-Path $here 'add-public-entry.ps1') }
        '5' { & powershell -ExecutionPolicy Bypass -File (Join-Path $here 'add-public-entry.ps1') -Apply }
        '6' { Run 'test-live-clario.ps1' }
        '7' { Run 'publish-json.ps1' }
        '8' { Run 'restore-last-backup.ps1' }
        '0' { break }
        default { Write-Host "Choix invalide." -ForegroundColor Yellow }
    }
}
