const pool = require('../db');

// Ajouter un nouvel étage
exports.addFloor = async (req, res) => {
    try {
        const { name, placesNumber } = req.body;

        if (!name || placesNumber === undefined) {
            return res.status(400).json({ message: "Le nom et le nombre de places sont requis." });
        }

        const [result] = await pool.query(
            'INSERT INTO floors (name, placesNumber) VALUES (?, ?)',
            [name, placesNumber]
        );

        res.status(201).json({ message: "Étage ajouté avec succès.", floorId: result.insertId });
    } catch (error) {
        console.error("Erreur lors de l'ajout de l'étage :", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};

// Ajouter une nouvelle place à un étage
exports.addPlace = async (req, res) => {
    try {
        const { name, floorId, positionX, positionY } = req.body;

        if (!floorId) {
            return res.status(400).json({ message: "L'identifiant de l'étage est requis." });
        }

        const [result] = await pool.query(
            'INSERT INTO places (name, floorId, positionX, positionY) VALUES (?, ?, ?, ?)',
            // Si la position n'est pas envoyée, on met 0 par défaut
            [name || null, floorId, positionX || 0, positionY || 0] 
        );

        res.status(201).json({ message: "Place ajoutée avec succès.", placeId: result.insertId });
    } catch (error) {
        console.error("Erreur lors de l'ajout de la place :", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};

// Modifier une place existante (l'activer/désactiver ou changer sa position)
exports.updatePlace = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, active, positionX, positionY } = req.body;

        const [result] = await pool.query(
            'UPDATE places SET name = ?, active = ?, positionX = ?, positionY = ? WHERE id = ?',
            [name, active, positionX, positionY, id]
        );

        // Si la ligne n'a pas été affectée, c'est que l'ID n'existe pas
        if (result.affectedRows === 0) {
             return res.status(404).json({ message: "Place introuvable." });
        }

        res.status(200).json({ message: "Place modifiée avec succès." });
    } catch (error) {
        console.error("Erreur lors de la modification de la place :", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};

// Récupérer la liste complète des réservations (vue globale pour l'administrateur)
exports.getAllReservations = async (req, res) => {
    try {
        // Requête avec jointures pour afficher des données compréhensibles (nom au lieu d'IP)
        const query = `
            SELECT r.id, r.date, r.timeSlot, 
                   u.firstName, u.lastName, u.email,
                   p.name AS placeName, f.name AS floorName
            FROM reservations r
            JOIN users u ON r.userId = u.id
            JOIN places p ON r.placeId = p.id
            JOIN floors f ON p.floorId = f.id
            ORDER BY r.date DESC
        `;
        const [reservations] = await pool.query(query);
        res.status(200).json(reservations);
    } catch (error) {
        console.error("Erreur lors de la récupération des réservations :", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};
