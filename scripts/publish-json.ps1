
# scripts/publish-json.ps1
# Rôle : Publier uniquement data/formations.json après validation sécurisée.

$ErrorActionPreference = 'Stop'

Write-Host "\n=== Démarrage de la publication sécurisée du catalogue Clario ===\n"

# 1. Exécuter le script de vérification
Write-Host "- Exécution de la vérification de sécurité (scripts/check-clario.ps1)..."
Try {
    & "./scripts/check-clario.ps1"
    If ($LASTEXITCODE -ne 0) {
        Write-Host "[ÉCHEC] La vérification de sécurité a échoué. Publication annulée."
        Exit 1
    }
    Write-Host "[OK] La vérification de sécurité a réussi."
}
Catch {
    Write-Host "[ERREUR] Impossible d'exécuter scripts/check-clario.ps1 : $($_.Exception.Message)"
    Exit 1
}

# 2. Préparer la publication Git
Write-Host "\n- Préparation des changements Git..."

# Afficher le statut Git (pour information)
Write-Host "  Statut Git actuel :"
git status --short

# Ajouter uniquement data/formations.json
Write-Host "  Ajout de data/formations.json à l'index Git..."
git add data/formations.json

# Vérifier si des changements ont été ajoutés (pour éviter un commit vide)
$stagedChanges = git diff --cached --name-only
If ($stagedChanges -notcontains "data/formations.json") {
    Write-Host "[INFO] Aucune modification à data/formations.json n'a été détectée ou ajoutée. Publication non nécessaire."
    Exit 0
}

# Committer les changements
Write-Host "  Commit des changements..."
git commit -m "Mise à jour catalogue Clario"

# Pousser vers origin main
Write-Host "  Push des changements vers origin main..."
git push origin main

Write-Host "\n[RÉUSSITE] data/formations.json a été publié avec succès."
Exit 0
