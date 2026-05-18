const express = require('express');
const router = express.Router();
const floorController = require('../controllers/floorController');
const placeController = require('../controllers/placeController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Lecture : tout utilisateur authentifié
router.get('/', verifyToken, floorController.getAllFloors);

// Écriture : admin uniquement
router.post('/', verifyToken, isAdmin, floorController.createFloor);
router.put('/:id', verifyToken, isAdmin, floorController.updateFloor);
router.delete('/:id', verifyToken, isAdmin, floorController.deleteFloor);

// Ajout de place à un étage (admin)
router.post('/:floorId/places', verifyToken, isAdmin, placeController.createPlace);

module.exports = router;
