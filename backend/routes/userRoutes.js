// routes/userRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // <-- Ajouté pour générer le token au login
const db = require('../config/db.js');
const authenticateToken = require('../middleware/auth'); // <-- Importer notre middleware

const router = express.Router();
const saltRounds = 10; // Déplacé ici pour être réutilisé

// === ROUTES PUBLIQUES (Pas besoin de token) ===

// Route POST /api/login (connexion)
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`API: Tentative de connexion pour : ${email}`);

    if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis." });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    db.get(sql, [email], (err, user) => {
        if (err) {
            console.error("API Erreur DB[login]:", err.message);
            return res.status(500).json({ message: "Erreur serveur lors de la connexion." });
        }
        if (!user) {
            console.log(`API Login: Utilisateur non trouvé (${email})`);
            return res.status(401).json({ message: "Identifiants incorrects." }); // Message générique
        }
        if (!user.is_active) {
            console.log(`API Login: Compte inactif (${email})`);
            return res.status(403).json({ message: "Votre compte est désactivé." });
        }

        bcrypt.compare(password, user.password, (compareErr, isMatch) => {
            if (compareErr) {
                console.error("API Erreur bcrypt[login]:", compareErr);
                return res.status(500).json({ message: "Erreur serveur lors de la vérification." });
            }
            if (isMatch) {
                console.log(`API Login: Connexion réussie pour ${email}`);
                // Préparer le payload pour le JWT (NE PAS METTRE D'INFOS SENSIBLES)
                const userPayload = {
                    id: user.id,
                    role: user.role, 
                };
                // Générer le token JWT
                const accessToken = jwt.sign(
                    userPayload,
                    process.env.ACCESS_TOKEN_SECRET,
                );

                // Préparer les données utilisateur à renvoyer (SANS le hash du mdp)
                const userToSend = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    isActive: !!user.is_active // Convertir 0/1 en true/false
                };

                // Renvoyer succès, infos utilisateur ET le token
                return res.status(200).json({
                    message: "Connexion réussie !",
                    user: userToSend,
                    token: accessToken // Le frontend devra stocker ce token
                });
            } else {
                console.log(`API Login: Mot de passe incorrect pour ${email}`);
                return res.status(401).json({ message: "Identifiants incorrects." }); // Message générique
            }
        });
    });
});

// === ROUTES PROTÉGÉES (Nécessitent un token valide via authenticateToken) ===
// Le middleware authenticateToken sera appliqué avant chaque handler de ces routes

// Route GET /api/users (récupérer tous les utilisateurs - Admin requis)
router.get('/users', authenticateToken, (req, res) => { // authenticateToken appliqué ici !
    // Vérification du rôle ADMIN (après que authenticateToken ait mis req.user)
    if (req.user.role !== 'admin') {
        console.log(`API GET /users: Accès refusé (rôle ${req.user.role} != admin) pour user ID ${req.user.id}`);
        return res.status(403).json({ message: "Accès refusé. Rôle Administrateur requis." });
    }

    console.log(`API GET /users: Requête par Admin ID ${req.user.id}`);
    const sql = "SELECT id, email, first_name, last_name, role, is_active FROM users ORDER BY last_name, first_name";
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("API Erreur DB[get users]:", err.message);
            return res.status(500).json({ message: "Erreur serveur." });
        }
        const users = rows.map(user => ({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            isActive: !!user.is_active // Conversion en booléen
        }));
        // La réponse DOIT être un objet contenant la clé "users" comme attendu par le frontend
        res.status(200).json({ users: users });
    });
});

// Route POST /api/users (création d'utilisateur - Admin requis)
router.post('/users', authenticateToken, async (req, res) => { // authenticateToken appliqué ici !
    // Vérification du rôle ADMIN
    if (req.user.role !== 'admin') {
        console.log(`API POST /users: Accès refusé (rôle ${req.user.role} != admin) pour user ID ${req.user.id}`);
        return res.status(403).json({ message: "Accès refusé. Rôle Administrateur requis." });
    }

    console.log(`API POST /users: Requête création par Admin ID ${req.user.id}`);
    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Les champs email, password, firstName et lastName sont requis." });
    }
    // Validation simple du rôle (optionnel mais recommandé)
    const userRole = ['admin', 'client'].includes(role) ? role : 'client'; // Défaut 'client'

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const sql = `INSERT INTO users (email, password, first_name, last_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)`;
        const isActive = 1; // Nouvel utilisateur actif par défaut
        const params = [email.trim(), hashedPassword, firstName.trim(), lastName.trim(), userRole, isActive];

        db.run(sql, params, function (err) { // Utiliser 'function' pour avoir accès à 'this.lastID'
            if (err) {
                if (err.message.includes('UNIQUE constraint failed: users.email')) {
                    return res.status(409).json({ message: "Cet email est déjà utilisé." }); // 409 Conflict
                } else {
                    console.error("API Erreur DB[create user]:", err.message);
                    return res.status(500).json({ message: "Erreur serveur lors de la création." });
                }
            }
            // Renvoyer l'utilisateur créé (sans le mot de passe hashé)
            const newUser = {
                id: this.lastID,
                email: email.trim(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                role: userRole,
                isActive: !!isActive // Convertir en booléen
            };
            console.log(`API POST /users: Utilisateur ID ${newUser.id} créé par Admin ID ${req.user.id}`);
            res.status(201).json({ message: "Utilisateur créé avec succès !", user: newUser }); // 201 Created
        });
    } catch (hashError) {
        console.error("API Erreur bcrypt[create user]:", hashError);
        res.status(500).json({ message: "Erreur serveur interne (hash)." });
    }
});

// Route PATCH /api/users/:id (Modifier un utilisateur - Admin requis)
router.patch('/users/:id', authenticateToken, async (req, res) => { // authenticateToken appliqué ici !
    // Vérification du rôle ADMIN
    if (req.user.role !== 'admin') {
        console.log(`API PATCH /users/${req.params.id}: Accès refusé (rôle ${req.user.role} != admin) pour user ID ${req.user.id}`);
        return res.status(403).json({ message: "Accès refusé. Rôle Administrateur requis." });
    }

    const userIdToUpdate = req.params.id;
    console.log(`API PATCH /users/${userIdToUpdate}: Requête MAJ par Admin ID ${req.user.id}. Body:`, req.body);
    const { role, isActive, firstName, lastName, email } = req.body;

    const updateFields = [];
    const params = [];
    let hasPotentiallySensitiveChange = false; // Pour retracer si l'email ou le rôle change

    if (role !== undefined) {
        if (!['admin', 'client'].includes(role)) {
             return res.status(400).json({ message: `Rôle invalide: ${role}` });
        }
        updateFields.push("role = ?");
        params.push(role);
        hasPotentiallySensitiveChange = true;
    }
    if (isActive !== undefined) {
        // Convertit true->1, false->0, '1'->1, '0'->0, null/undefined->NaN
        const activeValue = isActive === true || isActive === 1 || isActive === '1' ? 1 : (isActive === false || isActive === 0 || isActive === '0' ? 0 : -1);
        if (![0, 1].includes(activeValue)) {
             return res.status(400).json({ message: `Statut 'isActive' invalide: ${isActive}. Doit être true/false ou 1/0.` });
        }
        updateFields.push("is_active = ?");
        params.push(activeValue);
    }
     if (firstName !== undefined) {
        if (typeof firstName !== 'string' || firstName.trim() === '') { return res.status(400).json({ message: `Prénom invalide.` }); }
        updateFields.push("first_name = ?");
        params.push(firstName.trim());
    }
     if (lastName !== undefined) {
        if (typeof lastName !== 'string' || lastName.trim() === '') { return res.status(400).json({ message: `Nom invalide.` }); }
        updateFields.push("last_name = ?");
        params.push(lastName.trim());
    }
    if (email !== undefined) {
        // Validation email très basique
         if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
             return res.status(400).json({ message: `Format d'email invalide.` });
         }
        updateFields.push("email = ?");
        params.push(email.trim());
        hasPotentiallySensitiveChange = true;
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ message: "Aucun champ valide à mettre à jour fourni." });
    }

    // Empêcher de changer le rôle ou désactiver le dernier admin (exemple simple)
    // Une logique plus robuste serait nécessaire en production
    if (hasPotentiallySensitiveChange && parseInt(userIdToUpdate, 10) === req.user.id) {
         if (role !== undefined && role !== 'admin') {
              return res.status(400).json({ message: "Vous ne pouvez pas retirer votre propre rôle administrateur." });
         }
          if (isActive !== undefined && Number(isActive) === 0) {
              // Vérifier s'il reste d'autres admins actifs ? Logique complexe...
              // Pour simplifier : on interdit à un admin de se désactiver lui-même
               return res.status(400).json({ message: "Vous ne pouvez pas désactiver votre propre compte administrateur." });
          }
    }


    params.push(userIdToUpdate);
    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    db.run(sql, params, function (err) {
        if (err) {
             if (err.message.includes('UNIQUE constraint failed: users.email')) {
                return res.status(409).json({ message: "Cet email est déjà utilisé par un autre compte." });
            }
            console.error(`API Erreur DB[update user ${userIdToUpdate}]:`, err.message);
            return res.status(500).json({ message: "Erreur serveur lors de la mise à jour." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // Récupérer l'utilisateur mis à jour pour le renvoyer
        const selectSql = "SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = ?";
        db.get(selectSql, [userIdToUpdate], (selectErr, updatedUser) => {
             if (selectErr || !updatedUser) {
                 console.error(`API Erreur DB[select after update ${userIdToUpdate}]:`, selectErr?.message || "Utilisateur non trouvé après MAJ");
                 return res.status(200).json({ message: "Mise à jour réussie, mais impossible de récupérer les données à jour." });
             }
            const userToSend = {
                 id: updatedUser.id,
                 email: updatedUser.email,
                 firstName: updatedUser.first_name,
                 lastName: updatedUser.last_name,
                 role: updatedUser.role,
                 isActive: !!updatedUser.is_active // Conversion
             };
             console.log(`API PATCH /users/${userIdToUpdate}: Succès par Admin ID ${req.user.id}`);
            res.status(200).json({ message: "Utilisateur mis à jour avec succès !", user: userToSend });
        });
    });
});

// Route DELETE /api/users/:id (Supprimer un utilisateur - Admin requis)
router.delete('/users/:id', authenticateToken, (req, res) => { // authenticateToken appliqué ici !
     // Vérification du rôle ADMIN
    if (req.user.role !== 'admin') {
         console.log(`API DELETE /users/${req.params.id}: Accès refusé (rôle ${req.user.role} != admin) pour user ID ${req.user.id}`);
        return res.status(403).json({ message: "Accès refusé. Rôle Administrateur requis." });
    }

    const userIdToDelete = req.params.id;
    console.log(`API DELETE /users/${userIdToDelete}: Requête suppression par Admin ID ${req.user.id}`);

    // Empêcher un admin de se supprimer lui-même
    if (req.user.id === parseInt(userIdToDelete, 10)) {
         console.warn(`API DELETE /users/${userIdToDelete}: Tentative d'auto-suppression par Admin ID ${req.user.id}`);
         return res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte administrateur." });
    }

    const sql = "DELETE FROM users WHERE id = ?";
    db.run(sql, [userIdToDelete], function (err) {
        if (err) {
            console.error(`API Erreur DB[delete user ${userIdToDelete}]:`, err.message);
            return res.status(500).json({ message: "Erreur serveur lors de la suppression." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }
        console.log(`API DELETE /users/${userIdToDelete}: Succès par Admin ID ${req.user.id}`);
        // On peut renvoyer un 200 avec message ou un 204 sans contenu
        res.status(200).json({ message: "Utilisateur supprimé avec succès." });
        // res.sendStatus(204); // Alternative
    });
});


module.exports = router;