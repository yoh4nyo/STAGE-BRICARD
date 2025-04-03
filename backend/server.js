require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./config/db.js');
const userRoutes = require('./routes/userRoutes'); 
const projectOptionsRoutes = require('./routes/projectOptionsRoutes');

const app = express();
const PORT = process.env.PORT || 3001;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 


app.use('/api', userRoutes);
app.use('/api', projectOptionsRoutes);


app.listen(PORT, () => {
    console.log(`Backend démarré sur http://localhost:${PORT}`);
    if (!process.env.ACCESS_TOKEN_SECRET) {
        console.warn("\x1b[33m%s\x1b[0m", "ATTENTION: La variable d'environnement ACCESS_TOKEN_SECRET n'est pas définie ! L'authentification JWT échouera.");
    }
});