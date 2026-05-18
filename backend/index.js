const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Importation de la configuration base de données (ceci va au passage déclencher le test de connexion)
require('./db');


// Importation des routes
const authRoutes = require('./routes/authRoutes');
const floorRoutes = require('./routes/floorRoutes');
const placeRoutes = require('./routes/placeRoutes');
const reservationRoutes = require('./routes/reservationRoutes');

// Middlewares
app.use(cors());
app.use(express.json());

// Configuration globale des routes
app.use('/api/auth', authRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/reservations', reservationRoutes);

// Routes basiques
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API du backend Node.js !' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Le serveur backend tourne sur le port ${PORT}`);
});
