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

        req.user = userPayload;
        console.log('Token vérifié, req.user attaché:', req.user);

        if (!req.user || typeof req.user.id === 'undefined') {
             console.error("Erreur critique: Le payload JWT décodé ne contient pas d'ID utilisateur ! Payload:", req.user);
             return res.status(500).json({ message: "Erreur interne: Impossible d'identifier l'utilisateur à partir du token." });
        }


        next(); 
    });
};

module.exports = authenticateToken;