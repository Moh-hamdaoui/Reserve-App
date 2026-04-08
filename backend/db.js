// Importation du module mysql2 avec le support des promesses (async/await)
const mysql = require('mysql2/promise');
require('dotenv').config(); // Charge les variables du fichier .env

// Création d'un "pool" de connexions
// Un pool gère plusieurs connexions simultanées, c'est plus performant qu'une seule connexion qui s'ouvre et se ferme pour chaque requête.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Nombre maximum de connexions actives en même temps
    queueLimit: 0
});

// Fonction pour tester si la connexion fonctionne au démarrage du serveur
const testConnection = async () => {
    try {
        // On essaie d'obtenir une connexion depuis le pool
        const connection = await pool.getConnection(); 
        console.log('✅ Connecté avec succès à la base de données MySQL !');
        connection.release(); 
    } catch (error) {
        // Si la DB n'existe pas, on essaie de la créer
        if (error.code === 'ER_BAD_DB_ERROR') {
            try {
                const tempPool = mysql.createPool({
                    host: process.env.DB_HOST,
                    user: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    waitForConnections: true,
                    connectionLimit: 1
                });
                
                const tempConnection = await tempPool.getConnection();
                await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
                console.log('✅ Base de données créée avec succès !');
                tempConnection.release();
                tempPool.end();
                
                // Test final + create tables
                const finalConnection = await pool.getConnection();
                await finalConnection.execute(`
                    CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        firstName VARCHAR(50) NOT NULL,
                        lastName VARCHAR(50) NOT NULL,
                        email VARCHAR(100) UNIQUE NOT NULL,
                        password VARCHAR(255) NOT NULL,
                        role ENUM('user', 'admin') DEFAULT 'user',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                console.log('✅ Table users créée !');
                console.log('✅ Connecté avec succès à la base de données MySQL !');
                finalConnection.release();
            } catch (createError) {
                console.error('❌ Erreur création DB :', createError.message);
            }
        } else {
            console.error('❌ Erreur de connexion à la base de données :', error.message);
            console.log('➜ Indice : Vérifiez que XAMPP est lancé.');
        }
    }
};

// On lance le test tout de suite
testConnection();

// On exporte 'pool' pour pouvoir l'utiliser dans le reste de notre code (ex: faire des SELECT, INSERT...)
module.exports = pool;
