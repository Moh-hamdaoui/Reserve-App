-- Jeu de données de démonstration pour Reserve-App
-- Usage : mysql -u root desk_booking < backend/seed.sql

USE desk_booking;

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM reservations;
DELETE FROM places;
DELETE FROM floors;
SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE floors AUTO_INCREMENT = 1;
ALTER TABLE places AUTO_INCREMENT = 1;

-- Étages
INSERT INTO floors (name, placesNumber) VALUES
  ('Étage 1', 8),
  ('Étage 2', 6);

-- Places — Étage 1 : salles de part et d’autre d’un couloir (positionX/Y en base 0)
INSERT INTO places (name, active, floorId, positionX, positionY) VALUES
  ('Salle 101', 1, 1, 1, 0),
  ('Salle 102', 1, 1, 2, 0),
  ('Salle 103', 1, 1, 4, 0),
  ('Salle 104', 0, 1, 5, 0),
  ('Salle 105', 1, 1, 1, 2),
  ('Salle 106', 1, 1, 2, 2),
  ('Salle 107', 1, 1, 4, 2),
  ('Salle 108', 1, 1, 5, 2);

-- Places — Étage 2 : disposition en U autour du palier / escalier
INSERT INTO places (name, active, floorId, positionX, positionY) VALUES
  ('Salle 201', 1, 2, 0, 0),
  ('Salle 202', 1, 2, 1, 0),
  ('Salle 203', 1, 2, 2, 0),
  ('Salle 204', 1, 2, 1, 2),
  ('Salle 205', 0, 2, 0, 2),
  ('Salle 206', 1, 2, 2, 2);

-- Compteur de places par étage
UPDATE floors SET placesNumber = (SELECT COUNT(*) FROM places WHERE floorId = floors.id);

-- Utilisateurs de démo (mot de passe : password123)
INSERT IGNORE INTO users (firstName, lastName, email, password, role) VALUES
  ('Marie', 'Dupont', 'marie@demo.com', '$2b$10$DafDH5H5gCoCrqTO2Gi8puMtDWLrx2KQi3uYimoyy8E0bX2IFjRXq', 'user'),
  ('Jean', 'Martin', 'jean@demo.com', '$2b$10$DafDH5H5gCoCrqTO2Gi8puMtDWLrx2KQi3uYimoyy8E0bX2IFjRXq', 'user'),
  ('Sophie', 'Leroy', 'sophie@demo.com', '$2b$10$DafDH5H5gCoCrqTO2Gi8puMtDWLrx2KQi3uYimoyy8E0bX2IFjRXq', 'user'),
  ('Paul', 'Bernard', 'paul@demo.com', '$2b$10$DafDH5H5gCoCrqTO2Gi8puMtDWLrx2KQi3uYimoyy8E0bX2IFjRXq', 'user'),
  ('Claire', 'Moreau', 'claire@demo.com', '$2b$10$DafDH5H5gCoCrqTO2Gi8puMtDWLrx2KQi3uYimoyy8E0bX2IFjRXq', 'user'),
  ('Admin', 'Demo', 'admin@demo.com', '$2b$10$DafDH5H5gCoCrqTO2Gi8puMtDWLrx2KQi3uYimoyy8E0bX2IFjRXq', 'admin');

-- Réservations pour aujourd'hui (périodes variées pour tester le filtre)
INSERT INTO reservations (userId, placeId, date, period)
SELECT u.id, p.id, CURDATE(), 'morning'
FROM users u
JOIN places p ON p.name = 'Salle 102'
WHERE u.email = 'marie@demo.com';

INSERT INTO reservations (userId, placeId, date, period)
SELECT u.id, p.id, CURDATE(), 'afternoon'
FROM users u
JOIN places p ON p.name = 'Salle 105'
WHERE u.email = 'jean@demo.com';

INSERT INTO reservations (userId, placeId, date, period)
SELECT u.id, p.id, CURDATE(), 'full'
FROM users u
JOIN places p ON p.name = 'Salle 108'
WHERE u.email = 'sophie@demo.com';

INSERT INTO reservations (userId, placeId, date, period)
SELECT u.id, p.id, CURDATE(), 'morning'
FROM users u
JOIN places p ON p.name = 'Salle 201'
WHERE u.email = 'paul@demo.com';

INSERT INTO reservations (userId, placeId, date, period)
SELECT u.id, p.id, CURDATE(), 'afternoon'
FROM users u
JOIN places p ON p.name = 'Salle 204'
WHERE u.email = 'claire@demo.com';
