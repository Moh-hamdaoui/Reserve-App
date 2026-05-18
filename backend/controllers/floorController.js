const pool = require('../db');

// GET /api/floors - Liste tous les étages avec leurs places
exports.getAllFloors = async (req, res) => {
    try {
        const [floors] = await pool.query('SELECT * FROM floors ORDER BY id');
        const [places] = await pool.query('SELECT * FROM places ORDER BY floorId, id');

        const result = floors.map(floor => ({
            ...floor,
            places: places.filter(p => p.floorId === floor.id)
        }));

        res.status(200).json(result);
    } catch (error) {
        console.error('Erreur getAllFloors :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

// POST /api/floors - Ajouter un étage (admin)
exports.createFloor = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Le nom est requis.' });
        }
        const [result] = await pool.query(
            'INSERT INTO floors (name, placesNumber) VALUES (?, 0)',
            [name]
        );
        res.status(201).json({ id: result.insertId, name, placesNumber: 0, places: [] });
    } catch (error) {
        console.error('Erreur createFloor :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

// PUT /api/floors/:id - Renommer un étage (admin)
exports.updateFloor = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Le nom est requis.' });
        }
        const [result] = await pool.query(
            'UPDATE floors SET name = ? WHERE id = ?',
            [name, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Étage introuvable.' });
        }
        res.status(200).json({ id: Number(id), name });
    } catch (error) {
        console.error('Erreur updateFloor :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

// DELETE /api/floors/:id - Supprimer un étage (admin)
exports.deleteFloor = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM floors WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Étage introuvable.' });
        }
        res.status(200).json({ message: 'Étage supprimé.' });
    } catch (error) {
        console.error('Erreur deleteFloor :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
