const express = require('express');
const router = express.Router();
const db = require('../config/db');
// ---> ASSURE-TOI que ce chemin est correct vers ton middleware d'authentification <---
const authenticateToken = require('../middleware/auth'); // Si ton fichier s'appelle auth.js, utilise require('../middleware/auth')

// ---> Route pour CRÉER un nouveau projet <---
router.post('/projects', authenticateToken, (req, res) => {
    console.log("Backend: Received POST /api/projects request");
    console.log("Backend: Request body:", req.body);

    // 1. Récupérer les données du corps de la requête
    const { name, type, creationDate, securityLevel } = req.body;

    // 2. ---> CORRECTION : Utiliser l'ID utilisateur du token <---
    const userId = req.user?.id; // Récupère l'ID depuis le middleware authenticateToken

    // 3. Validation (vérifie aussi userId)
    if (!name || !type || !creationDate || !securityLevel || !userId) {
         console.error("Backend: Missing data for project creation or user ID missing", { name, type, creationDate, securityLevel, userId });
         // Si userId est manquant, c'est probablement un problème d'authentification non géré avant
         if (!userId) return res.status(401).json({ message: "Utilisateur non authentifié ou ID utilisateur manquant."});
         return res.status(400).json({ message: "Données manquantes pour la création du projet." });
    }

    // 4. Préparer la requête SQL INSERT
    const query = `
        INSERT INTO projects (name, type, creation_date, security_level, user_id)
        VALUES (?, ?, ?, ?, ?)
    `;
    const params = [name, type, creationDate, securityLevel, userId];

    // 5. Exécuter la requête
    db.run(query, params, function(err) {
        if (err) {
            console.error("Backend: SQLite INSERT error:", err.message);
            return res.status(500).json({ message: "Erreur serveur lors de la création du projet." });
        }

        // 6. Succès !
        console.log(`Backend: Project created successfully with ID: ${this.lastID} for user ID: ${userId}`);
        res.status(201).json({
            message: "Projet créé avec succès !",
            projectId: this.lastID,
        });
    });
});

// ---> Route pour Mettre à jour les détails d'un projet (Étape 2) <---
router.patch('/projects/:id/details', authenticateToken, (req, res) => {
    const projectId = req.params.id;
    // ---> CORRECTION : Utiliser l'ID utilisateur du token <---
    const userId = req.user?.id;
    const details = req.body;

    // Vérifier si userId est présent (devrait l'être si authenticateToken passe)
     if (!userId) {
         console.error("Backend: User ID missing after auth in PATCH /projects/:id/details");
         return res.status(401).json({ message: "Utilisateur non authentifié ou ID utilisateur manquant."});
     }

    console.log(`Backend: Received PATCH /api/projects/${projectId}/details for user ${userId}`);
    console.log("Backend: Details received:", details);

    const fieldsToUpdate = [];
    const params = [];
    const columnMapping = {
        logementDoors: 'logement_doors',
        hasPrivateCellars: 'has_private_cellars',
        commonDoors: 'common_doors',
        extraCommonKeys: 'extra_common_keys',
        pgKeys: 'pg_keys',
        totalDoorsPG: 'total_doors_pg'
    };

    for (const key in details) {
        // Vérifie si la clé existe dans le mapping ET si la valeur n'est pas undefined
        if (details.hasOwnProperty(key) && columnMapping[key] && details[key] !== undefined) {
            fieldsToUpdate.push(`${columnMapping[key]} = ?`);
            params.push(typeof details[key] === 'boolean' ? (details[key] ? 1 : 0) : details[key]);
        }
    }

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ message: "Aucune donnée de détail valide fournie." });
    }

    params.push(projectId); // Pour la clause WHERE id = ?
    params.push(userId);    // Pour la clause WHERE user_id = ?

    const query = `
        UPDATE projects
        SET ${fieldsToUpdate.join(', ')}
        WHERE id = ? AND user_id = ?
    `;

    console.log("Backend: Executing UPDATE Query:", query);
    console.log("Backend: With Params:", params);

    db.run(query, params, function(err) {
        if (err) {
            console.error("Backend: SQLite UPDATE error:", err.message);
            return res.status(500).json({ message: "Erreur serveur lors de la mise à jour des détails." });
        }
        if (this.changes === 0) {
             console.warn(`Backend: No project found with ID ${projectId} for user ${userId}, or no changes needed.`);
            return res.status(404).json({ message: "Projet non trouvé ou non autorisé." });
        }
        console.log(`Backend: Project details updated successfully for project ID: ${projectId}`);
        res.status(200).json({ message: "Détails du projet mis à jour avec succès !" });
    });
});


// ---> NOUVELLE ROUTE : GET pour lister les projets de l'utilisateur connecté <---
router.get('/projects', authenticateToken, (req, res) => {
    // ---> CORRECTION : Utiliser l'ID utilisateur du token <---
    const userId = req.user?.id;

    // Vérifier si userId est présent
     if (!userId) {
         console.error("Backend: User ID missing after auth in GET /projects");
         return res.status(401).json({ message: "Utilisateur non authentifié ou ID utilisateur manquant."});
     }

    console.log(`Backend: Request received for projects of user ID: ${userId}`);

    // Sélectionne tous les champs de la table projects pour cet utilisateur
    const query = "SELECT * FROM projects WHERE user_id = ? ORDER BY creation_date DESC";

    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error(`Backend: Error fetching projects for user ${userId}:`, err.message);
            return res.status(500).json({ message: "Erreur serveur lors de la récupération des projets." });
        }
        console.log(`Backend: Found ${rows.length} projects for user ${userId}.`);
        // Renvoie les projets trouvés (sera un tableau vide si aucun projet)
        res.json(rows);
    });
});


// ---> AJOUTE ICI D'AUTRES ROUTES POUR LES PROJETS SI NÉCESSAIRE <---
// Exemple : GET /api/projects/:id (pour voir un projet spécifique de l'utilisateur)
// router.get('/projects/:id', authenticateToken, (req, res) => { ... });


module.exports = router;