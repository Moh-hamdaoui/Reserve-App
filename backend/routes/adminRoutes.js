const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Sécurité Globale pour ce fichier :
// Toutes les requêtes tapant sur ce routeur devront avoir un token valide ET avoir le rôle 'admin'.
router.use(verifyToken, isAdmin);

// --- ROUTES POUR LES ETAGES ---
router.post('/floors', adminController.addFloor);

// --- ROUTES POUR LES PLACES ---
router.post('/places', adminController.addPlace);
router.put('/places/:id', adminController.updatePlace);

// --- ROUTES POUR LES RESERVATIONS (Supervision admin) ---
router.get('/reservations', adminController.getAllReservations);

module.exports = router;
