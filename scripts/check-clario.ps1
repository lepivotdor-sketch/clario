
# scripts/check-clario.ps1
# Rôle : Valider data/formations.json et vérifier les règles de sécurité avant publication.

$ErrorActionPreference = 'Stop'

Function Test-JsonValidity {
    Param (
        [string]$Path
    )
    Write-Host "- Vérification de la validité JSON de '$Path'..."
    Try {
        Get-Content -Raw $Path | ConvertFrom-Json | Out-Null
        Write-Host "  [OK] Le fichier JSON est valide."
        return $true
    }
    Catch {
        Write-Host "  [ERREUR] Le fichier JSON est invalide : $($_.Exception.Message)"
        return $false
    }
}

Function Test-FormationFields {
    Param (
        [array]$Formations
    )
    Write-Host "- Vérification des champs obligatoires et de la sécurité des formations..."
    $isValid = $true
    $requiredFields = @('code', 'id', 'titre', 'prix_numerique', 'categorie', 'description_courte', 'stripe_link')
    $forbiddenKeywords = @('modules complets', 'méthode complète', 'exercices complets', 'contenu pédagogique complet', 'texte client complet', 'accès privé', '_private_local')

    For ($i = 0; $i -lt $Formations.Count; $i++) {
        $formation = $Formations[$i]
        $formationName = $formation.titre -replace '[^a-zA-Z0-9]', '_' # Pour un nom de formation plus propre dans les logs
        Write-Host "  Vérification de la formation '$formationName' (index $i)..."

        # Vérification des champs obligatoires
        ForEach ($field in $requiredFields) {
            If (-not $formation.($field)) {
                Write-Host "    [ERREUR] Champ obligatoire '$field' manquant ou vide."
                $isValid = $false
            }
        }

        # Vérification du stripe_link
        If ($formation.stripe_link -notlike 'https://buy.stripe.com/*') {
            Write-Host "    [ERREUR] 'stripe_link' invalide pour '$formationName'. Doit commencer par 'https://buy.stripe.com/'."
            $isValid = $false
        }

        # Vérification des champs privés interdits
        $formationJson = $formation | ConvertTo-Json -Compress
        ForEach ($keyword in $forbiddenKeywords) {
            If ($formationJson -match "`"$([regex]::Escape($keyword))`"") {
                Write-Host "    [ERREUR] Mot-clé privé interdit '$keyword' trouvé dans la formation '$formationName'."
                $isValid = $false
            }
        }
    }
    If ($isValid) {
        Write-Host "  [OK] Toutes les formations respectent les règles de champs et de sécurité."
    }
    return $isValid
}

# --- Exécution du script ---
$formationsFilePath = "./data/formations.json"
$overallStatus = $true

Write-Host "\n=== Démarrage de la vérification Clario ===\n"

# 1. Vérifier la validité du JSON
If (-not (Test-JsonValidity -Path $formationsFilePath)) {
    $overallStatus = $false
}

If ($overallStatus) {
    $formations = Get-Content -Raw $formationsFilePath | ConvertFrom-Json
    # 2. Vérifier les champs des formations et les mots-clés interdits
    If (-not (Test-FormationFields -Formations $formations)) {
        $overallStatus = $false
    }
}

Write-Host "\n=== Rapport de vérification ==="
If ($overallStatus) {
    Write-Host "[RÉUSSITE] Le fichier data/formations.json est OK pour publication."
    Exit 0 # Succès
}
Else {
    Write-Host "[ÉCHEC] Le fichier data/formations.json contient des erreurs. À corriger avant publication."
    Exit 1 # Échec
}
