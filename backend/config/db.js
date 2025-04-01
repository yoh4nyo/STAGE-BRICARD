// Ce fichier est responsable de la connexion à la base de données SQLite
const sqlite3 = require('sqlite3').verbose(); // .verbose() donne plus d'infos en cas d'erreur

// Chemin vers ton fichier de base de données SQLite
// Assure-toi que ce chemin est correct par rapport à l'endroit où tourne server.js
const DBSOURCE = "bricard_app.db"; // Le nom de fichier que tu as créé

// Connexion à la base de données
// db est l'objet qui te permettra d'exécuter des requêtes
let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Erreur de connexion
      console.error('Erreur lors de la connexion à la base de données SQLite:', err.message);
      throw err; // Arrête l'application si la BDD n'est pas accessible
    } else {
        console.log('Connecté à la base de données SQLite.');
        // Optionnel: Tu pourrais créer la table ici si elle n'existe pas,
        // mais comme tu l'as déjà créée manuellement, ce n'est pas nécessaire.
        // Exemple: db.run(`CREATE TABLE ... IF NOT EXISTS ...`, (err) => { ... });
    }
});

// Exporte l'objet db pour pouvoir l'utiliser dans tes routes/controllers
module.exports = db;

// --- Le reste de ton code server.js (Express, routes, etc.) viendra après ---
// Si tu mets ce code dans config/db.js, importe-le dans server.js:
// const db = require('./config/db.js');