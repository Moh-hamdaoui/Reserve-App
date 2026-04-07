const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Definition de la route POST pour l'inscription
router.post('/register', authController.register);

// Definition de la route POST pour la connexion
router.post('/login', authController.login);

module.exports = router;
