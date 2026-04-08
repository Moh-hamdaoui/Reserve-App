const pool = require('../db');

// Récupérer la liste des étages et de leurs places (pour dessiner le plan)
exports.getFloorsAndPlaces = async (req, res) => {
    try {
        const [floors] = await pool.query('SELECT * FROM floors');
        const [places] = await pool.query('SELECT * FROM places WHERE active = true'); // On cache les chaises désactivées par l'admin

        // Astuce : On imbrique les places dans leur étage pour faciliter le travail du Front-End (Angular)
        const data = floors.map(floor => {
            return {
                ...floor,
                places: places.filter(place => place.floorId === floor.id)
            };
        });

        res.status(200).json(data);
    } catch (error) {
        console.error("Erreur lors du listing des étages :", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Vérifier les réservations à une date donnée pour afficher les places occupées (en rouge)
exports.getAvailability = async (req, res) => {
    try {
        const { date } = req.query; // Exemple : /api/availability?date=2026-05-12
        
        if (!date) {
            return res.status(400).json({ message: "La date est obligatoire au format YYYY-MM-DD." });
        }

        const [reservations] = await pool.query(
            'SELECT placeId, timeSlot FROM reservations WHERE date = ?',
            [date]
        );

        res.status(200).json(reservations);
    } catch (error) {
        console.error("Erreur de disponibilité :", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Créer une réservation (LE COEUR DU SYSTEME)
exports.createReservation = async (req, res) => {
    try {
        const { placeId, date, timeSlot } = req.body;
        const userId = req.user.id; // Extrait du Token JWT de l'utilisateur

        if (!placeId || !date || !timeSlot) {
            return res.status(400).json({ message: "La place, la date et le créneau sont obligatoires." });
        }

        // REGLE 1 : La date ne doit pas dépasser 3 semaines dans le futur
        const reservationDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // On retire l'heure pour comparer des jours purs
        
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 21); // Maximum = J+21

        if (reservationDate < today) {
            return res.status(400).json({ message: "Les voyages dans le temps sont interdits." });
        }
        if (reservationDate > maxDate) {
            return res.status(400).json({ message: "Les réservations sont bloquées à 3 semaines (21 jours) d'avance." });
        }

        // Vérification du créneau
        const validSlots = ["full", "morning", "afternoon"];
        if (!validSlots.includes(timeSlot)) {
            return res.status(400).json({ message: "Le créneau doit être : full, morning ou afternoon." });
        }

        // REGLE 2 : Empêcher 2 personnes de prendre le même siège
        const [existing] = await pool.query(
            'SELECT timeSlot FROM reservations WHERE placeId = ? AND date = ?',
            [placeId, date]
        );

        let conflict = false;
        existing.forEach(reser => {
            // Si la place est prise toute la journée, on ne peut plus rien réserver. Et inversement.
            if (reser.timeSlot === 'full' || timeSlot === 'full') conflict = true;
            // Si le sous-créneau (matin) est le même, c'est bloqué.
            if (reser.timeSlot === timeSlot) conflict = true;
        });

        if (conflict) {
            return res.status(400).json({ message: "Désolé, mais cette place est déjà occupée pour cette plage horaire." });
        }

        // Tout est bon, on l'insert en base de données !
        const [result] = await pool.query(
            'INSERT INTO reservations (userId, placeId, date, timeSlot) VALUES (?, ?, ?, ?)',
            [userId, placeId, date, timeSlot]
        );

        res.status(201).json({ message: "Réservation réussie.", reservationId: result.insertId });
    } catch (error) {
        console.error("Erreur lors de la réservation :", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Consulter ses propres réservations
exports.getMyReservations = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Petite jointure bien pratique pour renvoyer le nom de la place à l'utilisateur au lieu d'un simple ID
        const query = `
            SELECT r.id, r.date, r.timeSlot, p.name AS placeName, f.name AS floorName
            FROM reservations r
            JOIN places p ON r.placeId = p.id
            JOIN floors f ON p.floorId = f.id
            WHERE r.userId = ?
            ORDER BY r.date DESC
        `;
        const [reservations] = await pool.query(query, [userId]);
        
        res.status(200).json(reservations);
    } catch (error) {
        console.error("Erreur historique perso :", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

// Annuler sa réservation
exports.cancelReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // La condition `userId = ?` est cruciale ici. Elle empeche Bob d'annuler la réservation de Alice (sécurité)
        const [result] = await pool.query(
            'DELETE FROM reservations WHERE id = ? AND userId = ?',
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(403).json({ message: "Action refusée : réservation introuvable ou vous n'en êtes pas propriétaire." });
        }

        res.status(200).json({ message: "Réservation annulée avec succès." });
    } catch (error) {
        console.error("Erreur annulation :", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
};
