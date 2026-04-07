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
        // Il faut toujours relâcher (libérer) une connexion pour qu'elle puisse être réutilisée par quelqu'un d'autre
        connection.release(); 
    } catch (error) {
        console.error('❌ Erreur de connexion à la base de données :', error.message);
        console.log('➜ Indice : Vérifiez que XAMPP est lancé, et que la base de données "' + process.env.DB_NAME + '" existe bien.');
    }
};

// On lance le test tout de suite
testConnection();

// On exporte 'pool' pour pouvoir l'utiliser dans le reste de notre code (ex: faire des SELECT, INSERT...)
module.exports = pool;
