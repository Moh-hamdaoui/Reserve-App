const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Verification si l'email est deja utilise dans la base de donnees
        const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Cet email est deja utilise." });
        }

        // Hachage du mot de passe pour la securite
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insertion dans la base de donnees. Le role 'user' est defini par defaut dans le schema.
        const [result] = await pool.query(
            'INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)',
            [firstName, lastName, email, hashedPassword]
        );

        res.status(201).json({ 
            message: "Utilisateur cree avec succes.", 
            accessToken: jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: '24h' }),
            user: {
                id: result.insertId,
                firstName,
                lastName,
                email
            }
        });
    } catch (error) {
        console.error("Erreur lors de l'inscription :", error);
        res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
    }
};

// Connexion d'un utilisateur existant
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Recuperation de l'utilisateur par son email
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: "Identifiants invalides." });
        }

        const user = users[0];

        // Comparaison du mot de passe fourni avec le mot de passe hache en base
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Identifiants invalides." });
        }

        // Creation du contenu du token (payload)
        const payload = {
            id: user.id,
            role: user.role
        };

        // Generation du token JWT signe
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '24h' // Le token est valide pour 24 heures
        });

        res.status(200).json({
            message: "Connexion reussie.",
            accessToken: token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        res.status(500).json({ message: "Erreur serveur lors de la connexion." });
    }
};
