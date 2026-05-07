#requires -Version 5.1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$jsonPath = Join-Path $root 'data\formations.json'

# Objectifs officiels Clario : 240 formations
$objectifs = [ordered]@{
    'IA'            = 50
    'Productivité'  = 50
    'Apprentissage' = 40
    'Business'      = 40
    'Finances'      = 30
    'Relations'     = 20
    'Bonheur'       = 5
    'Santé'         = 5
}
$totalCible = ($objectifs.Values | Measure-Object -Sum).Sum

# 1. Validité fichier
if (-not (Test-Path $jsonPath)) {
    Write-Host "[ERREUR] data/formations.json introuvable : $jsonPath" -ForegroundColor Red
    exit 1
}
try {
    $raw = [System.IO.File]::ReadAllText($jsonPath, [System.Text.Encoding]::UTF8)
    $data = $raw | ConvertFrom-Json
} catch {
    Write-Host "[ERREUR] data/formations.json invalide : $_" -ForegroundColor Red
    exit 1
}

$total = $data.Count
$restant = $totalCible - $total
$progressionPct = if ($totalCible -gt 0) { [math]::Round(($total / $totalCible) * 100, 1) } else { 0 }

# 2. Compter par catégorie
$compteurs = [ordered]@{}
foreach ($cat in $objectifs.Keys) { $compteurs[$cat] = 0 }
$categoriesInconnues = New-Object System.Collections.Generic.List[string]
foreach ($f in $data) {
    if ($null -ne $f.categorie -and $compteurs.Contains($f.categorie)) {
        $compteurs[$f.categorie]++
    } else {
        $categoriesInconnues.Add("$($f.code) -> '$($f.categorie)'")
    }
}

# 3. Catégorie la plus en retard (déficit absolu) + prioritaire (% le plus bas)
$enRetardCat = $null; $enRetardDef = -1
$prioCat = $null; $prioPct = 999
foreach ($cat in $objectifs.Keys) {
    $cible = $objectifs[$cat]
    $cur = $compteurs[$cat]
    $def = $cible - $cur
    $pct = if ($cible -gt 0) { ($cur / $cible) * 100 } else { 100 }
    if ($def -gt $enRetardDef) { $enRetardDef = $def; $enRetardCat = $cat }
    if ($pct -lt $prioPct) { $prioPct = $pct; $prioCat = $cat }
}

# 4. Anomalies dans le JSON public
$sansStripe       = $data | Where-Object { -not $_.stripe_link }
$stripeInvalide   = $data | Where-Object { $_.stripe_link -and ($_.stripe_link -notlike 'https://buy.stripe.com/*') }
$prixOK           = @(5,15,25,50,160,320)
$prixInvalide     = $data | Where-Object { $prixOK -notcontains $_.prix_numerique }
$slugManquant     = $data | Where-Object { -not $_.id -or -not $_.slug }
$titreManquant    = $data | Where-Object { -not $_.titre }

# Sortie
Write-Host ""
Write-Host "===== Pipeline Clario - 240 formations =====" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total publié : $total / $totalCible" -ForegroundColor White
Write-Host "Restant      : $restant"
Write-Host "Progression  : $progressionPct %"
Write-Host ""
Write-Host "--- Progression par catégorie ---" -ForegroundColor Cyan
foreach ($cat in $objectifs.Keys) {
    $cible = $objectifs[$cat]
    $cur = $compteurs[$cat]
    $def = $cible - $cur
    $pct = if ($cible -gt 0) { [math]::Round(($cur / $cible) * 100, 1) } else { 0 }
    $bar = ('#' * [math]::Min($cur, $cible)).PadRight($cible, '.')
    Write-Host ("{0,-14} {1,3}/{2,-3} ({3,5} %)  reste {4,3}" -f $cat, $cur, $cible, $pct, $def)
}

Write-Host ""
Write-Host "Catégorie la plus en retard (déficit absolu) : $enRetardCat (manque $enRetardDef)" -ForegroundColor Yellow
Write-Host "Catégorie prioritaire suivante (% le plus bas) : $prioCat ($([math]::Round($prioPct,1)) %)" -ForegroundColor Yellow

Write-Host ""
Write-Host "--- Anomalies JSON public ---" -ForegroundColor Cyan
Write-Host "Sans Stripe          : $($sansStripe.Count)"
Write-Host "Stripe invalide      : $($stripeInvalide.Count)"
Write-Host "Prix invalide        : $($prixInvalide.Count)"
Write-Host "Slug/Id manquant     : $($slugManquant.Count)"
Write-Host "Titre manquant       : $($titreManquant.Count)"
Write-Host "Catégorie inconnue   : $($categoriesInconnues.Count)"
if ($categoriesInconnues.Count -gt 0) {
    foreach ($x in $categoriesInconnues) { Write-Host "  - $x" -ForegroundColor Yellow }
}

Write-Host ""
$anomaliesTotal = $sansStripe.Count + $stripeInvalide.Count + $prixInvalide.Count + $slugManquant.Count + $titreManquant.Count
if ($anomaliesTotal -gt 0) {
    Write-Host "Prochaine action : corriger les $anomaliesTotal anomalie(s) dans data/formations.json" -ForegroundColor Yellow
} elseif ($restant -gt 0) {
    Write-Host "Prochaine action : produire et publier la prochaine formation dans la catégorie '$prioCat'" -ForegroundColor Green
} else {
    Write-Host "Prochaine action : objectif 240/240 atteint." -ForegroundColor Green
}
exit 0
