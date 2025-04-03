const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/security-levels', (req, res) => {

    // --- 1. Requête SQL pour récupérer les GAMMES distinctes ---
    const query = 'SELECT DISTINCT GAMME FROM cylindre ORDER BY GAMME';

    // --- 2. Exécuter la requête avec db.all() ---
    db.all(query, [], (err, rows) => {
        // --- Gestion des erreurs de la requête ---
        if (err) {
            console.error("Backend Route: SQLite Query Error:", err.message); // Log 2
            return res.status(500).json({ message: "Erreur serveur lors de la récupération des niveaux de sécurité." });
        }

        // --- Traitement des résultats si la requête réussit ---
        try {
            // Extraire juste les noms des gammes
            const distinctGammes = rows.map(row => row.GAMME); // Possible point sensible : la casse de GAMME

            // --- 3. Mapper les GAMMES aux Niveaux de Sécurité du CDC ---
            const levelMapping = {
                'OCTAL': { code: 'Octal', label: 'Niveau 1: Octal' },
                'SERIAL': { code: 'Serial', label: 'Niveau 2: Serial (non protégées à la reproduction)' },
                'SERIAL S': { code: 'Serial S', label: 'Niveau 3 : Serial S (non protégées à la reproduction)' },
                'TERTIAL': { code: 'Tertial', label: 'Niveau 4: Tertial' },
                'SERIAL XP': { code: 'Serial XP', label: 'Niveau 5: Serial XP' },
                'DUAL XP S2': { code: 'Dual XP S2', label: 'Niveau 6: Dual XP S2' }
            };
            // Log 5 (Ajouté pour vérifier les clés du mapping)
            console.log("Backend Route: Mapping Keys:", Object.keys(levelMapping));

            // --- 4. Créer le tableau final pour l'API ---
            const securityLevels = distinctGammes
                .map(gamme => {
                    const mapped = levelMapping[gamme];
                    return mapped;
                })
                .filter(level => level !== undefined) // Ignore les gammes inconnues
                .sort((a, b) => { /* ... tri ... */ });

            // Log final avant envoi (débogage)
            console.log("Backend Route: Final formatted levels sent to API:", securityLevels); 

            // --- 5. Renvoyer les données formatées ---
            res.json(securityLevels);

        } catch (processingError) {
             // --- Gestion des erreurs ---
             console.error("Backend Route: Error during data processing:", processingError); // Log 9
             res.status(500).json({ message: "Erreur serveur lors du traitement des données de niveaux." });
        }
    });
});

module.exports = router;