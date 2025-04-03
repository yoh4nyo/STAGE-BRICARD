// middleware/auth.js (ou authenticateToken.js)
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: "Accès non autorisé. Token manquant." });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, userPayload) => {
        if (err) {
            console.error("Erreur de vérification JWT:", err.message);
            return res.status(403).json({ message: "Accès refusé. Token invalide ou expiré." });
        }

        // --- CORRECTION ICI ---
        // Le token est valide !
        // userPayload contient l'objet { id: ..., role: ..., etc. }
        // On attache cet objet entier à req.user
        req.user = userPayload;
        // --------------------

        // Log pour vérifier que l'objet user est correctement attaché
        // et contient bien les propriétés 'id' et 'role' (si tu l'as mis dans le token)
        console.log('Token vérifié, req.user attaché:', req.user);

        // Vérification optionnelle mais recommandée : le payload contient-il bien l'ID ?
        if (!req.user || typeof req.user.id === 'undefined') {
             console.error("Erreur critique: Le payload JWT décodé ne contient pas d'ID utilisateur ! Payload:", req.user);
             // Renvoyer une erreur interne car le token est mal formé ou la logique de création est mauvaise
             return res.status(500).json({ message: "Erreur interne: Impossible d'identifier l'utilisateur à partir du token." });
        }


        next(); // Passe au prochain middleware ou à la route
    });
};

module.exports = authenticateToken;