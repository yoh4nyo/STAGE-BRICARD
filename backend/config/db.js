const sqlite3 = require('sqlite3').verbose();

const DBSOURCE = "bricard_app.db";

// Connexion à la base de données
let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Erreur de connexion
      console.error('Erreur lors de la connexion à la base de données SQLite:', err.message);
      throw err; // Arrête l'application si la BDD n'est pas accessible
    } else {
        console.log('Connecté à la base de données SQLite.');
    }
});

module.exports = db;