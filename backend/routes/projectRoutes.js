const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth'); 

// --- Route pour CRÉER un projet complet en une fois (utilisée par la soumission finale de la modale) ---
router.post('/projects', authenticateToken, (req, res) => {
    console.log("Backend: Received POST /api/projects request (combined steps)");

    // 1. Récupérer TOUTES les données (base + détails)
    const {
        name, type, creationDate, securityLevel,
        logementDoors, hasPrivateCellars, commonDoors, extraCommonKeys,
        pgKeys, totalDoorsPG
    } = req.body;

    // 2. Récupérer l'ID utilisateur
    const userId = req.user?.id;

    // 3. Validation des données de base
    if (!name || !type || !creationDate || !securityLevel || !userId) {
        console.error("Backend: Missing base data for project creation", { name, type, creationDate, securityLevel, userId });
         if (!userId) return res.status(401).json({ message: "Utilisateur non authentifié."});
         return res.status(400).json({ message: "Données de base manquantes pour la création." });
    }

    console.log("Backend: Creating project with data:", req.body);

    // 4. Préparer la requête SQL INSERT avec TOUTES les colonnes
    const query = `
        INSERT INTO projects (
            name, type, creation_date, security_level, user_id,
            logement_doors, has_private_cellars, common_doors, extra_common_keys,
            pg_keys, total_doors_pg
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // 5. Préparer les paramètres (gestion booléens et null)
    const params = [
        name, type, creationDate, securityLevel, userId,
        logementDoors ?? null,
        hasPrivateCellars !== undefined && hasPrivateCellars !== null ? (hasPrivateCellars ? 1 : 0) : null,
        commonDoors ?? null,
        extraCommonKeys !== undefined && extraCommonKeys !== null ? (extraCommonKeys ? 1 : 0) : null,
        pgKeys ?? null,
        totalDoorsPG ?? null
    ];

    // 6. Exécuter la requête
    db.run(query, params, function(err) {
        if (err) {
            console.error("Backend: SQLite INSERT error (combined):", err.message);
            return res.status(500).json({ message: "Erreur serveur lors de la création complète du projet." });
        }

        // 7. Succès !
        console.log(`Backend: Complete project created successfully with ID: ${this.lastID} for user ID: ${userId}`);
        res.status(201).json({
            message: "Projet complet créé avec succès !",
            projectId: this.lastID,
        });
    });
});


// --- Route pour MODIFIER les détails d'un projet existant (pour plus tard, ex: mode brouillon) ---
router.patch('/projects/:id/details', authenticateToken, (req, res) => {
    const projectId = req.params.id;
    const userId = req.user?.id; // Récupère l'ID utilisateur du token
    const details = req.body;   // Les nouvelles valeurs pour les détails

    if (!userId) {
        return res.status(401).json({ message: "Utilisateur non authentifié."});
    }
    // On ne modifie que les détails ici, pas les infos de base (name, type etc.)
    // Si tu veux modifier aussi les infos de base, il faudra adapter ou créer une route PUT / PATCH sur /projects/:id
    console.log(`Backend: Received PATCH /api/projects/${projectId}/details for user ${userId}`);
    console.log("Backend: Details to update received:", details);

    const fieldsToUpdate = [];
    const params = [];
    // Mapping UNIQUEMENT pour les colonnes de détails modifiables ici
    const columnMapping = {
        logementDoors: 'logement_doors',
        hasPrivateCellars: 'has_private_cellars',
        commonDoors: 'common_doors',
        extraCommonKeys: 'extra_common_keys',
        pgKeys: 'pg_keys',
        totalDoorsPG: 'total_doors_pg',
        name: 'name',
        securityLevel: 'security_level',
    };

    for (const key in details) {
        if (details.hasOwnProperty(key) && columnMapping[key] && details[key] !== undefined) {
            fieldsToUpdate.push(`${columnMapping[key]} = ?`);
             if (key === 'hasPrivateCellars' || key === 'extraCommonKeys') {
                 params.push(details[key] ? 1 : 0);
             } else {
                 params.push(details[key]);
             }
        }
    }

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ message: "Aucune donnée de détail valide fournie pour la mise à jour." });
    }

    params.push(projectId);
    params.push(userId);    

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
             console.warn(`Backend: No project found with ID ${projectId} for user ${userId} to update, or no changes needed.`);
            return res.status(404).json({ message: "Projet non trouvé ou non autorisé pour la modification." });
        }
        console.log(`Backend: Project details updated successfully for project ID: ${projectId}`);
        res.status(200).json({ message: "Détails du projet mis à jour avec succès !" });
    });
});


// --- Route GET pour lister les projets de l'utilisateur connecté ---
router.get('/projects', authenticateToken, (req, res) => {
    const userId = req.user?.id;
     if (!userId) {
         return res.status(401).json({ message: "Utilisateur non authentifié."});
     }
    console.log(`Backend: Request received for projects of user ID: ${userId}`);
    const query = "SELECT * FROM projects WHERE user_id = ? ORDER BY creation_date DESC";
    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error(`Backend: Error fetching projects for user ${userId}:`, err.message);
            return res.status(500).json({ message: "Erreur serveur lors de la récupération des projets." });
        }
        res.json(rows);
    });
});


// --- Autres routes possibles ---
// GET /projects/:id - Récupérer les détails d'un projet spécifique (pour le charger en modification)
// DELETE /projects/:id - Supprimer un projet

module.exports = router;