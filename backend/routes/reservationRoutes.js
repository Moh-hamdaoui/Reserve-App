const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(verifyToken);

// Routes spécifiques avant les paramètres dynamiques
router.get('/mine', reservationController.getMine);
router.get('/all', isAdmin, reservationController.getAll);

router.get('/', reservationController.getByDate);
router.post('/', reservationController.create);
router.delete('/:id', reservationController.cancel);

module.exports = router;
