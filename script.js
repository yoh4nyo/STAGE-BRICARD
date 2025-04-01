// Attend que le contenu HTML soit entièrement chargé
document.addEventListener('DOMContentLoaded', () => {

    // Sélectionne le formulaire et la zone de message d'erreur
    const loginForm = document.getElementById('login-form');
    const errorMessageDiv = document.getElementById('error-message');

    // Ajoute un écouteur d'événement pour la soumission du formulaire
    loginForm.addEventListener('submit', (event) => {
        // Empêche le comportement par défaut du formulaire (qui rechargerait la page)
        event.preventDefault();

        // Récupère les valeurs saisies par l'utilisateur
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Vide les messages d'erreur précédents
        errorMessageDiv.textContent = '';

        // --- Début de la logique de connexion (à remplacer/compléter) ---

        // C'est ici que tu ferais normalement un appel à ton API backend
        // pour vérifier les identifiants.

        // Exemple simple :
        console.log('Tentative de connexion avec :');
        console.log('Identifiant:', username);
        console.log('Mot de passe:', password); // Ne jamais logger le mot de passe en production!

        // Simulation d'une vérification (à adapter avec ton backend)
        if (username === "test@bricard.com" && password === "password123") {
            // Connexion réussie
            console.log('Connexion réussie (Simulation)');
            // Rediriger vers le tableau de bord (remplacer par la bonne URL)
            window.location.href = '/dashboard.html'; // Ou la page suivante
        } else {
            // Échec de la connexion
            console.log('Échec de la connexion (Simulation)');
            errorMessageDiv.textContent = 'Identifiant ou mot de passe incorrect.';
        }

        // --- Fin de la logique de connexion ---
    });

});