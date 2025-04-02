// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Le format attendu est "Bearer TOKEN"
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // Pas de token fourni
        return res.status(401).json({ message: "Accès non autorisé. Token manquant." });
    }

    // Vérifier le token avec la clé secrète de .env
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, userPayload) => {
        if (err) {
            console.error("Erreur de vérification JWT:", err.message);
            // Le token est invalide (mauvaise signature, expiré, etc.)
            // 403 Forbidden est souvent utilisé pour un token invalide/expiré
            return res.status(403).json({ message: "Accès refusé. Token invalide ou expiré." });
        }

        // Le token est valide ! Attacher le payload (qui contient les infos utilisateur) à req.user
        // !! IMPORTANT !! : Assure-toi que lorsque tu CRÉES le token (dans la route /login),
        // tu inclus bien l'id et le rôle dans le payload. Exemple : { id: user.id, role: user.role }
        req.user = userPayload;
        console.log('Token vérifié, req.user attaché:', req.user); // Pour débugger si besoin

        next(); // Passer au prochain middleware ou à la route finale
    });
};

module.exports = authenticateToken;