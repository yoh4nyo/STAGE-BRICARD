// backend/seed.js (exemple)
const bcrypt = require('bcrypt');
const db = require('./path/to/your/db/connection/file'); // Adapte le chemin

const email = 'test@bricard.com';
const plainPassword = 'password123'; // Le mot de passe en clair
const role = 'client'; // ou 'admin'
const saltRounds = 10; // Facteur de coût pour bcrypt (10 est un bon début)

console.log("Hachage du mot de passe...");
bcrypt.hash(plainPassword, saltRounds, (err, hashedPassword) => {
    if (err) {
        console.error("Erreur lors du hachage:", err);
        return;
    }

    console.log("Mot de passe haché:", hashedPassword);
    const sql = 'INSERT INTO users (email, password, role, is_active) VALUES (?, ?, ?, ?)';
    const params = [email, hashedPassword, role, 1]; // 1 pour is_active=true

    db.run(sql, params, function(err) { // Utilise function() pour accéder à this.lastID
        if (err) {
            if (err.message.includes("UNIQUE constraint failed")) {
                 console.warn(`L'utilisateur avec l'email ${email} existe déjà.`);
            } else {
                console.error("Erreur lors de l'insertion de l'utilisateur:", err.message);
            }
        } else {
            console.log(`Utilisateur ${email} inséré avec l'ID: ${this.lastID}`);
        }
         // Fermer la connexion DB si ce script est autonome
         // db.close();
    });
});