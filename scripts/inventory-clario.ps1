#requires -Version 5.1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$jsonPath = Join-Path $root 'data\formations.json'
$readyPath = Join-Path $root '_private_local\roadmap\clario-formations-pretes.md'

if (-not (Test-Path $jsonPath)) { Write-Host "[ERREUR] data/formations.json introuvable" -ForegroundColor Red; exit 1 }

$raw = [System.IO.File]::ReadAllText($jsonPath, [System.Text.Encoding]::UTF8)
$data = $raw | ConvertFrom-Json

$total = $data.Count
$avecStripe = ($data | Where-Object { $_.stripe_link -like 'https://buy.stripe.com/*' }).Count
$sansStripe = ($data | Where-Object { -not $_.stripe_link }).Count
$stripeInvalide = ($data | Where-Object { $_.stripe_link -and $_.stripe_link -notlike 'https://buy.stripe.com/*' }).Count

$pretesNonPubliees = 0
if (Test-Path $readyPath) {
    $ready = [System.IO.File]::ReadAllText($readyPath, [System.Text.Encoding]::UTF8)
    $idsPub = $data.id
    $matches = [regex]::Matches($ready, '(?m)^\s*[-*]\s*([a-z0-9-]+)')
    foreach ($m in $matches) {
        if ($idsPub -notcontains $m.Groups[1].Value) { $pretesNonPubliees++ }
    }
}

Write-Host ""
Write-Host "=== Inventaire Clario ===" -ForegroundColor Cyan
Write-Host "Total formations publiques : $total"
Write-Host "  - Avec Stripe valide     : $avecStripe"
Write-Host "  - Sans Stripe            : $sansStripe"
Write-Host "  - Stripe invalide        : $stripeInvalide"
Write-Host "Prêtes non publiées        : $pretesNonPubliees"
Write-Host ""

if ($sansStripe -gt 0 -or $stripeInvalide -gt 0) {
    Write-Host "Action : corriger les liens Stripe avant publication." -ForegroundColor Yellow
} elseif ($pretesNonPubliees -gt 0) {
    Write-Host "Action : ajouter les formations prêtes au catalogue public." -ForegroundColor Yellow
} else {
    Write-Host "Action : exécuter check-clario.ps1 puis publish-json.ps1" -ForegroundColor Green
}
