#requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string]$Code,
    [Parameter(Mandatory)] [string]$Id,
    [Parameter(Mandatory)] [string]$Titre,
    [Parameter(Mandatory)] [int]$Prix,
    [Parameter(Mandatory)] [string]$Categorie,
    [Parameter(Mandatory)] [string]$Niveau,
    [Parameter(Mandatory)] [string]$Duree,
    [Parameter(Mandatory)] [string]$DescriptionPublique,
    [Parameter(Mandatory)] [string]$StripeLink,
    [switch]$Apply,
    [switch]$Publish
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$jsonRel = 'data/formations.json'

function Stop-WithError($msg) {
    Write-Host ""
    Write-Host "[ARRÊT] $msg" -ForegroundColor Red
    exit 1
}

function Section($t) {
    Write-Host ""
    Write-Host "=== $t ===" -ForegroundColor Cyan
}

# 1. Vérifier dépôt Git
Section "1. Vérification du dépôt Git"
Push-Location $root
try {
    git rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -ne 0) { Stop-WithError "Le dossier courant n'est pas un dépôt Git : $root" }
    $remote = git config --get remote.origin.url
    Write-Host "Dépôt OK : $root"
    Write-Host "Remote   : $remote"
} finally { Pop-Location }

# 2. Vérifier que _private_local/ est ignoré
Section "2. Vérification .gitignore"
Push-Location $root
try {
    git check-ignore -q _private_local/
    if ($LASTEXITCODE -ne 0) { Stop-WithError "_private_local/ n'est PAS ignoré par Git. Risque de fuite privée." }
    Write-Host "_private_local/ ignoré : OK"
} finally { Pop-Location }

# 3. Dry-run add-public-entry (aucune modification)
Section "3. Dry-run add-public-entry (sans -Apply)"
$addScript = Join-Path $PSScriptRoot 'add-public-entry.ps1'
& powershell -ExecutionPolicy Bypass -File $addScript `
    -Code $Code -Id $Id -Titre $Titre -Prix $Prix `
    -Categorie $Categorie -Niveau $Niveau -Duree $Duree `
    -DescriptionPublique $DescriptionPublique -StripeLink $StripeLink
if ($LASTEXITCODE -ne 0) { Stop-WithError "Dry-run add-public-entry échoué. Aucune modification." }

# 5/6. Si pas -Apply, afficher la commande et s'arrêter
if (-not $Apply) {
    Section "Aperçu OK — prochaine étape"
    $cmd = "powershell -ExecutionPolicy Bypass -File .\scripts\publish-formation-clario.ps1 ``" + "`n" + `
           "  -Code `"$Code`" -Id `"$Id`" -Titre `"$Titre`" -Prix $Prix ``" + "`n" + `
           "  -Categorie `"$Categorie`" -Niveau `"$Niveau`" -Duree `"$Duree`" ``" + "`n" + `
           "  -DescriptionPublique `"$DescriptionPublique`" ``" + "`n" + `
           "  -StripeLink `"$StripeLink`" -Apply"
    Write-Host "Pour appliquer, relancer avec -Apply :" -ForegroundColor Yellow
    Write-Host $cmd
    Write-Host ""
    Write-Host "Ajouter -Publish pour publier sur origin/main." -ForegroundColor Yellow
    Write-Host "[DRY-RUN] Aucun fichier créé, aucune sauvegarde, aucun git." -ForegroundColor Green
    exit 0
}

# 6. Backup (uniquement avec -Apply, juste avant la modification réelle)
Section "6. Sauvegarde (avant -Apply)"
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'backup-clario.ps1')
if ($LASTEXITCODE -ne 0) { Stop-WithError "Sauvegarde échouée." }

# 7. Apply
Section "7. Application (-Apply)"
& powershell -ExecutionPolicy Bypass -File $addScript `
    -Code $Code -Id $Id -Titre $Titre -Prix $Prix `
    -Categorie $Categorie -Niveau $Niveau -Duree $Duree `
    -DescriptionPublique $DescriptionPublique -StripeLink $StripeLink -Apply
if ($LASTEXITCODE -ne 0) { Stop-WithError "Apply add-public-entry échoué." }

# 8. Check-clario
Section "8. Validation post-ajout (check-clario)"
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'check-clario.ps1')
if ($LASTEXITCODE -ne 0) { Stop-WithError "check-clario.ps1 a détecté des erreurs. Vérifie data/formations.json." }

# 9/10/11. git status — un seul fichier autorisé
Section "9. git status — vérification fichiers modifiés"
Push-Location $root
try {
    $statusLines = git status --porcelain
    Write-Host ($statusLines -join "`n")
    $modified = @()
    foreach ($line in $statusLines) {
        if ($line) { $modified += ($line.Substring(3)).Trim() }
    }
    $allowed = @($jsonRel)
    $unexpected = $modified | Where-Object { $allowed -notcontains $_ }
    if ($unexpected) {
        Stop-WithError "Fichiers inattendus modifiés : $($unexpected -join ', '). Aucun git effectué."
    }
    if ($modified -notcontains $jsonRel) {
        Stop-WithError "$jsonRel n'apparaît pas comme modifié. Rien à publier."
    }
    Write-Host "Seul $jsonRel est modifié : OK"
} finally { Pop-Location }

# 12. Si pas -Publish, afficher commande commit/push et s'arrêter
if (-not $Publish) {
    Section "Apply OK — publication non effectuée"
    Write-Host "Pour publier sur origin/main, lancer :" -ForegroundColor Yellow
    Write-Host "  git add $jsonRel"
    Write-Host "  git commit -m `"Ajout formation publique $Code - $Titre`""
    Write-Host "  git push origin main"
    Write-Host ""
    Write-Host "Ou relancer ce script avec -Publish pour automatiser." -ForegroundColor Yellow
    exit 0
}

# 13. Publication Git ciblée
Section "13. Publication Git (-Publish)"
Push-Location $root
try {
    git add $jsonRel
    if ($LASTEXITCODE -ne 0) { Stop-WithError "git add échoué." }

    $commitMsg = "Ajout formation publique $Code - $Titre"
    git commit -m $commitMsg
    if ($LASTEXITCODE -ne 0) { Stop-WithError "git commit échoué." }

    git push origin main
    if ($LASTEXITCODE -ne 0) { Stop-WithError "git push échoué (jamais --force). Vérifie l'état remote." }

    Write-Host "Publication OK : $commitMsg" -ForegroundColor Green
} finally { Pop-Location }

# 14. Test live
Section "14. Test live (peut nécessiter 1-2 min de redéploiement GitHub Pages)"
& powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'test-live-clario.ps1')
$liveExit = $LASTEXITCODE

# 15. Rapport final
Section "Rapport final"
Write-Host "Code         : $Code"
Write-Host "Titre        : $Titre"
Write-Host "Prix         : $Prix `$"
Write-Host "Catégorie    : $Categorie"
Write-Host "Apply        : OUI"
Write-Host "Publish      : OUI"
Write-Host "Test live    : $(if ($liveExit -eq 0) { 'OK' } else { 'À RE-VÉRIFIER (redéploiement en cours possible)' })"
Write-Host "Fichier modifié et publié : $jsonRel"
exit 0
