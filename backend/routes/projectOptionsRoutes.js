const express = require('express');
const router = express.Router();
const db = require('../config/db');

// --- Route pour récupérer les niveaux de sécurité ---
router.get('/security-levels', (req, res) => {

    // --- 1. Requête SQL pour récupérer les GAMMES distinctes ---
    const query = 'SELECT DISTINCT GAMME FROM cylindre ORDER BY GAMME';

    // --- 2. Exécuter la requête avec db.all() ---
    db.all(query, [], (err, rows) => {
        // --- Gestion des erreurs ---
        if (err) {
            console.error("Backend Route: SQLite Query Error:", err.message);
            return res.status(500).json({ message: "Erreur serveur lors de la récupération des niveaux de sécurité." });
        }

        try {
            const distinctGammes = rows.map(row => row.GAMME); 

            // --- 3. Mapper les GAMMES ---
            const levelMapping = {
                'OCTAL': { code: 'Octal', label: 'Niveau 1 : Octal' },
                'SERIAL': { code: 'Serial', label: 'Niveau 2 : Serial (non protégées à la reproduction)' },
                'SERIAL S': { code: 'Serial S', label: 'Niveau 3 : Serial S (non protégées à la reproduction)' },
                'TERTIAL': { code: 'Tertial', label: 'Niveau 4 : Tertial' },
                'SERIAL XP': { code: 'Serial XP', label: 'Niveau 5 : Serial XP' },
                'DUAL XP S2': { code: 'Dual XP S2', label: 'Niveau 6 : Dual XP S2' }
            };
            console.log("Backend Route: Mapping Keys:", Object.keys(levelMapping));

            // --- 4. Créer le tableau final pour l'API ---
            const securityLevels = distinctGammes
                .map(gamme => {
                    const mapped = levelMapping[gamme];
                    return mapped;
                })
                .filter(level => level !== undefined) 
                .sort((a, b) => { try {
                    const levelA = parseInt(a.label.match(/Niveau (\d+)/)[1]);
                    const levelB = parseInt(b.label.match(/Niveau (\d+)/)[1]);
                    return levelA - levelB;
                } catch (e) {
                    console.warn(`Could not parse level number from labels: '${a?.label}', '${b?.label}'`);
                    return 0;
                }
            });

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

// --- route qui permet de récupérer les types d'organigramme ---
router.get('/organigramme-types', (req, res) => {
    console.log("Backend Route: Organigramme Types requested"); // Log 1

    const organigrammeTypes = [
        { code: 'pg', label: 'PG (Passe générale)' },
        { code: 'im', label: 'IM (Immeuble)' },
        { code: 'pg + im', label: 'PG + IM (Passe générale + Immeuble)' },
    ];

    console.log("Backend Route: Organigramme Types sent to API:", organigrammeTypes); // Log 2
    res.json(organigrammeTypes);
})

module.exports = router;