const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Sécurité : Pour faire une réservation ou voir le plan, il faut prouver son identité.
// Ce middleware filtre TOUTES les routes situées en dessous.
router.use(verifyToken);

// --- Les routes de consultation Visuelle ---
router.get('/floors', userController.getFloorsAndPlaces);
router.get('/availability', userController.getAvailability);

// --- Les routes d'action Réservation ---
router.post('/reservations', userController.createReservation);
router.get('/reservations/me', userController.getMyReservations);
router.delete('/reservations/:id', userController.cancelReservation);

module.exports = router;
