#requires -Version 5.1
[CmdletBinding()]
param(
    [string]$BaseUrl = 'https://lepivotdor-sketch.github.io/clario'
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$localJson = Join-Path $root 'data\formations.json'

$problems = New-Object System.Collections.Generic.List[string]
$ok = New-Object System.Collections.Generic.List[string]

# 1. JSON live
$liveJsonUrl = "$BaseUrl/data/formations.json"
try {
    $live = Invoke-RestMethod -Uri $liveJsonUrl -TimeoutSec 15
    $ok.Add("JSON live accessible : $liveJsonUrl ($($live.Count) formations)")
} catch {
    $problems.Add("JSON live inaccessible : $liveJsonUrl")
    Write-Host "[ECHEC] $($problems[0])" -ForegroundColor Red
    exit 1
}

# 2. Codes locaux présents en live
$localData = [System.IO.File]::ReadAllText($localJson, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
$liveCodes = $live.code
foreach ($f in $localData) {
    if ($liveCodes -notcontains $f.code) {
        $problems.Add("Code absent du live : $($f.code)")
    }
}

# 3. Pages formation.html?id=...
foreach ($f in $live) {
    $url = "$BaseUrl/formation.html?id=$($f.id)"
    try {
        $r = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 10 -UseBasicParsing
        if ($r.StatusCode -ne 200) { $problems.Add("Page KO ($($r.StatusCode)) : $url") }
    } catch {
        $problems.Add("Page injoignable : $url")
    }
}

# 4. Stripe link présent
foreach ($f in $live) {
    if ($f.stripe_link -and $f.stripe_link -notlike 'https://buy.stripe.com/*') {
        $problems.Add("Stripe invalide [$($f.code)] : $($f.stripe_link)")
    }
    if (-not $f.stripe_link) {
        $problems.Add("Stripe manquant [$($f.code)]")
    }
}

Write-Host ""
Write-Host "=== Test live Clario ===" -ForegroundColor Cyan
foreach ($l in $ok) { Write-Host "[OK] $l" -ForegroundColor Green }
if ($problems.Count -eq 0) {
    Write-Host "[REUSSITE] Site live conforme au catalogue." -ForegroundColor Green
    Write-Host "Action : aucune."
    exit 0
} else {
    Write-Host "[PROBLEMES] $($problems.Count)" -ForegroundColor Yellow
    foreach ($p in $problems) { Write-Host "  - $p" -ForegroundColor Yellow }
    Write-Host "Action recommandée : corriger formations.json puis publier."
    exit 1
}
