const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Modification et suppression de places (admin)
router.put('/:id', verifyToken, isAdmin, placeController.updatePlace);
router.delete('/:id', verifyToken, isAdmin, placeController.deletePlace);

module.exports = router;
