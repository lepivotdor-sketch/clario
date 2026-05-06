
# scripts/inventory-clario.ps1
# Rôle : Lire data/formations.json et _private_local/roadmap/clario-formations-pretes.md pour afficher un inventaire et des recommandations.

$ErrorActionPreference = "Continue" # Permet de continuer même si _private_local/roadmap/clario-formations-pretes.md n'existe pas

Write-Host "\n=== Inventaire des formations Clario ===\n"

$formationsFilePath = "./data/formations.json"
$privateRoadmapPath = "./_private_local/roadmap/clario-formations-pretes.md"

# Vérifier l'existence de data/formations.json
If (-not (Test-Path $formationsFilePath)) {
    Write-Host "[ERREUR] Le fichier data/formations.json est introuvable. Impossible de générer l'inventaire."
    Exit 1
}

# Lire et parser data/formations.json
Try {
    $publicFormations = Get-Content -Raw $formationsFilePath | ConvertFrom-Json
} Catch {
    Write-Host "[ERREUR] Erreur lors de la lecture ou du parsing de data/formations.json : $($_.Exception.Message)"
    Exit 1
}

$totalPublicFormations = $publicFormations.Count
$formationsEnVente = 0
$formationsSansStripe = 0
$formationsAvecStripeInvalide = 0
$publishedFormationIds = @()

ForEach ($formation in $publicFormations) {
    $publishedFormationIds += $formation.id

    If ($formation.stripe_link -and ($formation.stripe_link -like "https://buy.stripe.com/*")) {
        $formationsEnVente++
    } ElseIf (-not $formation.stripe_link) {
        $formationsSansStripe++
    } Else {
        $formationsAvecStripeInvalide++
    }
}

# Lire _private_local/roadmap/clario-formations-pretes.md
$readyPrivateFormationIds = @()
If (Test-Path $privateRoadmapPath) {
    Write-Host "- Lecture de la feuille de route privée des formations prêtes..."
    $privateRoadmapContent = Get-Content -Path $privateRoadmapPath
    # Supposons que les IDs sont sur des lignes séparées ou dans des listes Markdown (- id)
    $privateRoadmapContent | ForEach-Object {
        If ($_ -match "^\s*[-*]?\s*([a-zA-Z0-9-]+)") {
            $readyPrivateFormationIds += $Matches[1]
        }
    }
} Else {
    Write-Host "[INFO] Le fichier $privateRoadmapPath est introuvable. Aucune formation privée prête ne sera prise en compte."
}

# Identifier les formations privées prêtes mais non publiées
$privateReadyNotPublished = @()
ForEach ($privateId in $readyPrivateFormationIds) {
    If ($publishedFormationIds -notcontains $privateId) {
        $privateReadyNotPublished += $privateId
    }
}

Write-Host "\n--- Résumé ---"
Write-Host "Nombre total de formations publiques : $totalPublicFormations"
Write-Host "  - Formations en vente (lien Stripe valide) : $formationsEnVente"
Write-Host "  - Formations sans lien Stripe : $formationsSansStripe"
Write-Host "  - Formations avec lien Stripe invalide : $formationsAvecStripeInvalide"

If ($privateReadyNotPublished.Count -gt 0) {
    Write-Host "Formations privées prêtes mais non publiées : $($privateReadyNotPublished.Count)"
    Write-Host "  - IDs : $($privateReadyNotPublished -join ", ")"
} Else {
    Write-Host "Aucune formation privée prête identifiée comme non publiée."
}

Write-Host "\n--- Prochaine action recommandée ---"
If ($formationsAvecStripeInvalide -gt 0) {
    Write-Host "1. Corriger les liens Stripe invalides dans data/formations.json."
} ElseIf ($formationsSansStripe -gt 0) {
    Write-Host "1. Ajouter des liens Stripe aux formations sans lien dans data/formations.json pour les mettre en vente."
} ElseIf ($privateReadyNotPublished.Count -gt 0) {
    Write-Host "1. Examiner les formations privées prêtes ($($privateReadyNotPublished -join ", ")) et envisager leur publication dans data/formations.json."
} Else {
    Write-Host "1. Toutes les formations publiques sont en ordre. Pensez à créer de nouvelles formations ou à mettre à jour les existantes."
}
Write-Host "2. Exécuter scripts/check-clario.ps1 régulièrement pour maintenir la qualité des données."
Write-Host "3. Utiliser scripts/publish-json.ps1 pour publier les mises à jour de data/formations.json en toute sécurité."

Write-Host "\n=== Inventaire terminé ==="
Exit 0
