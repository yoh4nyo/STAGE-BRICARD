// backend/server.js (début)
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001; // Utilise un port différent du frontend

app.use(cors()); // Autorise toutes les origines pour l'instant
app.use(express.json()); // Pour parser le JSON des requêtes

app.get('/', (req, res) => {
  res.send('Serveur Backend Bricard OK');
});

// ... (Tes routes /api/login etc. viendront ici plus tard)

app.listen(PORT, () => {
  console.log(`Backend démarré sur http://localhost:${PORT}`);
});