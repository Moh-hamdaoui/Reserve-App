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

-- Places — Étage 1
INSERT INTO places (name, active, floorId, positionX, positionY) VALUES
  ('A-1', 1, 1, 0, 0),
  ('A-2', 1, 1, 1, 0),
  ('A-3', 1, 1, 2, 0),
  ('A-4', 0, 1, 3, 0),
  ('A-5', 1, 1, 0, 1),
  ('A-6', 1, 1, 1, 1),
  ('A-7', 1, 1, 2, 1),
  ('A-8', 1, 1, 3, 1);

-- Places — Étage 2
INSERT INTO places (name, active, floorId, positionX, positionY) VALUES
  ('B-1', 1, 2, 0, 0),
  ('B-2', 1, 2, 1, 0),
  ('B-3', 1, 2, 2, 0),
  ('B-4', 1, 2, 3, 0),
  ('B-5', 0, 2, 0, 1),
  ('B-6', 1, 2, 1, 1);

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
JOIN places p ON p.name = 'A-2'
WHERE u.email = 'marie@demo.com';

INSERT INTO reservations (userId, placeId, date, period)
SELECT u.id, p.id, CURDATE(), 'afternoon'
FROM users u
JOIN places p ON p.name = 'A-5'
WHERE u.email = 'jean@demo.com';

INSERT INTO reservations (userId, placeId, date, period)
SELECT u.id, p.id, CURDATE(), 'full'
FROM users u
JOIN places p ON p.name = 'A-8'
WHERE u.email = 'sophie@demo.com';

INSERT INTO reservations (userId, placeId, date, period)
SELECT u.id, p.id, CURDATE(), 'morning'
FROM users u
JOIN places p ON p.name = 'B-1'
WHERE u.email = 'paul@demo.com';

INSERT INTO reservations (userId, placeId, date, period)
SELECT u.id, p.id, CURDATE(), 'afternoon'
FROM users u
JOIN places p ON p.name = 'B-4'
WHERE u.email = 'claire@demo.com';
