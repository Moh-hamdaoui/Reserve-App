const pool = require('../db');

const MAX_DAYS_AHEAD = 21; // 3 semaines
const VALID_PERIODS = ['full', 'morning', 'afternoon'];

// Helper : valide la date (pas dans le passé, max 3 semaines)
const validateDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        return 'Date invalide.';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date < today) {
        return 'La date ne peut pas être dans le passé.';
    }

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + MAX_DAYS_AHEAD);
    if (date > maxDate) {
        return `La réservation est limitée à ${MAX_DAYS_AHEAD} jours à l'avance.`;
    }
    return null;
};

// GET /api/reservations?date=YYYY-MM-DD - Toutes les réservations d'une date
exports.getByDate = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ message: 'Le paramètre date est requis.' });
        }

        const [rows] = await pool.query(
            `SELECT r.id, r.userId, r.placeId, r.date, r.period,
                    u.firstName, u.lastName
             FROM reservations r
             JOIN users u ON u.id = r.userId
             WHERE r.date = ?`,
            [date]
        );

        res.status(200).json(rows);
    } catch (error) {
        console.error('Erreur getByDate :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

// GET /api/reservations/mine - Réservations de l'utilisateur connecté
exports.getMine = async (req, res) => {
    try {
        const userId = Number(req.user.id);
        const [rows] = await pool.query(
            `SELECT r.id, r.placeId, r.date, r.period, r.created_at,
                    p.name AS placeName, p.floorId,
                    f.name AS floorName
             FROM reservations r
             JOIN places p ON p.id = r.placeId
             JOIN floors f ON f.id = p.floorId
             WHERE r.userId = ?
             ORDER BY r.date DESC, r.period`,
            [userId]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erreur getMine :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

// GET /api/reservations/all - Toutes les réservations (admin)
exports.getAll = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT r.id, r.userId, r.placeId, r.date, r.period, r.created_at,
                    u.firstName, u.lastName, u.email,
                    p.name AS placeName, p.floorId,
                    f.name AS floorName
             FROM reservations r
             JOIN users u ON u.id = r.userId
             JOIN places p ON p.id = r.placeId
             JOIN floors f ON f.id = p.floorId
             ORDER BY r.date DESC, r.period`
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erreur getAll :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

// POST /api/reservations - Créer une réservation
exports.create = async (req, res) => {
    try {
        const userId = Number(req.user.id);
        const { placeId, date, period = 'full' } = req.body;

        if (!placeId || !date) {
            return res.status(400).json({ message: 'placeId et date sont requis.' });
        }
        if (!VALID_PERIODS.includes(period)) {
            return res.status(400).json({ message: 'Période invalide.' });
        }

        const dateError = validateDate(date);
        if (dateError) {
            return res.status(400).json({ message: dateError });
        }

        // Vérifier que la place existe et est active
        const [places] = await pool.query('SELECT * FROM places WHERE id = ?', [placeId]);
        if (places.length === 0) {
            return res.status(404).json({ message: 'Place introuvable.' });
        }
        if (!places[0].active) {
            return res.status(400).json({ message: "Cette place n'est pas disponible à la réservation." });
        }

        // Vérifier les conflits : si la place a déjà une réservation "full" ce jour, ou si on essaie de prendre "full"
        // alors qu'une demi-journée existe déjà.
        const [conflicts] = await pool.query(
            'SELECT period FROM reservations WHERE placeId = ? AND date = ?',
            [placeId, date]
        );

        if (conflicts.length > 0) {
            const existingPeriods = conflicts.map(c => c.period);
            const hasFull = existingPeriods.includes('full');
            const wantsFull = period === 'full';
            const alreadyHasPeriod = existingPeriods.includes(period);

            if (hasFull || wantsFull || alreadyHasPeriod) {
                return res.status(409).json({ message: 'Cette place est déjà réservée pour cette période.' });
            }
        }

        try {
            const [result] = await pool.query(
                'INSERT INTO reservations (userId, placeId, date, period) VALUES (?, ?, ?, ?)',
                [userId, placeId, date, period]
            );
            res.status(201).json({
                id: result.insertId,
                userId,
                placeId,
                date,
                period
            });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Cette place est déjà réservée pour cette période.' });
            }
            throw err;
        }
    } catch (error) {
        console.error('Erreur create reservation :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

// DELETE /api/reservations/:id - Annuler sa propre réservation (ou n'importe laquelle si admin)
exports.cancel = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = Number(req.user.id);
        const isAdmin = req.user.role === 'admin';

        const [rows] = await pool.query('SELECT userId FROM reservations WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Réservation introuvable.' });
        }

        if (!isAdmin && Number(rows[0].userId) !== userId) {
            return res.status(403).json({ message: 'Vous ne pouvez annuler que vos propres réservations.' });
        }

        await pool.query('DELETE FROM reservations WHERE id = ?', [id]);
        res.status(200).json({ message: 'Réservation annulée.' });
    } catch (error) {
        console.error('Erreur cancel reservation :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
