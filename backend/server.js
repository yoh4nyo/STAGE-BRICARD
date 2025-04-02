require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./config/db.js');
const userRoutes = require('./routes/userRoutes'); 

const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 


// Utilise le routeur et préfixe les routes avec /api
app.use('/api', userRoutes);


app.listen(PORT, () => {
    console.log(`Backend démarré sur http://localhost:${PORT}`);
});