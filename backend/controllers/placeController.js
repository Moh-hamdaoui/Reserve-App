const pool = require('../db');

// POST /api/floors/:floorId/places - Ajouter une place à un étage (admin)
exports.createPlace = async (req, res) => {
    try {
        const { floorId } = req.params;
        const { name, positionX = 0, positionY = 0, active = true } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Le nom est requis.' });
        }

        // Vérifier que l'étage existe
        const [floors] = await pool.query('SELECT id FROM floors WHERE id = ?', [floorId]);
        if (floors.length === 0) {
            return res.status(404).json({ message: 'Étage introuvable.' });
        }

        const [result] = await pool.query(
            'INSERT INTO places (name, active, floorId, positionX, positionY) VALUES (?, ?, ?, ?, ?)',
            [name, active, floorId, positionX, positionY]
        );

        // Mettre à jour le compteur de places sur l'étage
        await pool.query(
            'UPDATE floors SET placesNumber = (SELECT COUNT(*) FROM places WHERE floorId = ?) WHERE id = ?',
            [floorId, floorId]
        );

        res.status(201).json({
            id: result.insertId,
            name,
            active,
            floorId: Number(floorId),
            positionX,
            positionY
        });
    } catch (error) {
        console.error('Erreur createPlace :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

// PUT /api/places/:id - Modifier une place (admin)
exports.updatePlace = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, active, positionX, positionY } = req.body;

        const [existing] = await pool.query('SELECT * FROM places WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Place introuvable.' });
        }

        const current = existing[0];
        const updated = {
            name: name ?? current.name,
            active: active ?? current.active,
            positionX: positionX ?? current.positionX,
            positionY: positionY ?? current.positionY
        };

        await pool.query(
            'UPDATE places SET name = ?, active = ?, positionX = ?, positionY = ? WHERE id = ?',
            [updated.name, updated.active, updated.positionX, updated.positionY, id]
        );

        res.status(200).json({ id: Number(id), floorId: current.floorId, ...updated });
    } catch (error) {
        console.error('Erreur updatePlace :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

// DELETE /api/places/:id - Supprimer une place (admin)
exports.deletePlace = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await pool.query('SELECT floorId FROM places WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Place introuvable.' });
        }
        const floorId = existing[0].floorId;

        await pool.query('DELETE FROM places WHERE id = ?', [id]);

        await pool.query(
            'UPDATE floors SET placesNumber = (SELECT COUNT(*) FROM places WHERE floorId = ?) WHERE id = ?',
            [floorId, floorId]
        );

        res.status(200).json({ message: 'Place supprimée.' });
    } catch (error) {
        console.error('Erreur deletePlace :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
