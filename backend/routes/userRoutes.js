const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const db = require('../config/db.js');

const router = express.Router(); 

// Route POST /api/users (création d'utilisateur)
router.post('/users', async (req, res) => { 

    // Vérification du rôle de l'utilisateur (admin requis)
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Accès refusé." });
    }
    // 1. Récupérer les données du corps de la requête
    const { email, password, firstName, lastName, role } = req.body;

    // 2. Validation
    if (!email || !password || !firstName || !lastName) {
        // Manque des champs obligatoires
        return res.status(400).json({ message: "Les champs email, password, firstName et lastName sont requis." });
    }

    try {
        // 3. Hacher le mot de passe avant de le stocker
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 4. Préparer la requête SQL INSERT
        const sql = `INSERT INTO users (email, password, first_name, last_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?)`;

        // Définir les valeurs pour les paramètres
        const userRole = role || 'client';
        const isActive = 1; 
        const params = [email, hashedPassword, firstName, lastName, userRole, isActive];

        // 5. Exécuter la requête SQL
        db.run(sql, params, function(err) {
            if (err) {
                // Gérer les erreurs potentielles
                if (err.message.includes('UNIQUE constraint failed: users.email')) {
                    // Erreur spécifique: l'email existe déjà
                    console.error(`Erreur: Tentative d'insertion avec un email déjà existant (${email})`);
                    return res.status(409).json({ message: "Cet email est déjà utilisé." }); // 409 Conflict
                } else {
                    // Autre erreur de base de données
                    console.error("Erreur lors de l'insertion dans la base de données:", err.message);
                    return res.status(500).json({ message: "Erreur serveur lors de la création de l'utilisateur." });
                }
            }

            // 6. Insertion réussie 
            console.log(`Nouvel utilisateur inséré avec l'ID: ${this.lastID}, Email: ${email}`);

            // Renvoyer une réponse de succès (statut 201 Created)
            res.status(201).json({
                message: "Utilisateur créé avec succès !",
                user: {
                    id: this.lastID, // ID généré par la BDD
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    role: userRole,
                    isActive: !!isActive 
                }
            });
        });

    } catch (hashError) {
        // Gérer une erreur potentielle lors du hachage
        console.error("Erreur lors du hachage du mot de passe:", hashError);
        res.status(500).json({ message: "Erreur serveur lors de la préparation de la création de l'utilisateur." });
    }
});


// Route POST /api/login (connexion)
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    console.log(`Tentative de connexion pour : ${email}`); // Log l'email

    if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis." });
    }

    // 1. Rechercher l'utilisateur par email dans la BDD
    const sql = "SELECT * FROM users WHERE email = ?"; // Utilise ? pour éviter les injections SQL
    const params = [email];

    db.get(sql, params, (err, user) => { // db.get récupère une seule ligne
        if (err) {
            console.error("Erreur lors de la recherche de l'utilisateur:", err.message);
            return res.status(500).json({ message: "Erreur serveur lors de la connexion." });
        }

        // 2. Vérifier si l'utilisateur existe
        if (!user) {
            console.log(`Utilisateur non trouvé pour email: ${email}`);
            return res.status(401).json({ message: "Identifiant ou mot de passe incorrect." });
        }

        // 3. Vérifier si le compte est actif
        if (!user.is_active) {
             console.log(`Compte inactif pour email: ${email}`);
             return res.status(403).json({ message: "Votre compte est désactivé." }); // 403 Forbidden
        }

        // 4. Comparer le mot de passe fourni avec le hash stocké
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error("Erreur lors de la comparaison bcrypt:", err);
                return res.status(500).json({ message: "Erreur serveur lors de la vérification." });
            }

            if (isMatch) {
                // Connexion réussie !
                console.log(`Connexion réussie pour : ${email}`);
                // Préparer les données utilisateur à renvoyer
                const userToSend = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.first_name,
                    lastName: user.last_name
                };
                // Renvoyer succès et infos utilisateur
                return res.status(200).json({
                    message: "Connexion réussie !",
                    user: userToSend
                });
            } else {
                // Mot de passe incorrect
                console.log(`Mot de passe incorrect pour : ${email}`);
                return res.status(401).json({ message: "Identifiant ou mot de passe incorrect." });
            }
        });
    });
});

// Route GET /api/users (récupérer tous les utilisateurs)
router.get('/users', async (req, res) => {
    try {
        // 1. Requête SQL pour récupérer tous les utilisateurs
        const sql = "SELECT id, email, first_name, last_name, role, is_active FROM users"; // Sélectionne les champs voulus

        // 2. Exécuter la requête
        db.all(sql, [], (err, rows) => { // db.all pour récupérer plusieurs lignes
            if (err) {
                console.error("Erreur lors de la récupération des utilisateurs :", err.message);
                return res.status(500).json({ message: "Erreur serveur lors de la récupération des utilisateurs." });
            }

            // 3. Traiter les résultats 
            const users = rows.map(user => ({
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                isActive: !!user.is_active 
            }));


            // 4. Renvoyer les utilisateurs
            res.status(200).json({ users });
        });

    } catch (error) {
        console.error("Erreur inattendue :", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});


module.exports = router; // Exporte le routeur