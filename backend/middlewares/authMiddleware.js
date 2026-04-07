const jwt = require('jsonwebtoken');

// Middleware 1 : Verifier si l'utilisateur possede un token valide
exports.verifyToken = (req, res, next) => {
    // Le token est generalement envoye dans l'en-tete Authorization sous la forme "Bearer mon_token_ici"
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(403).json({ message: "Aucun token fourni. Acces refuse." });
    }

    // On separe le mot "Bearer" du token pour recuperer uniquement le token
    const token = authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(403).json({ message: "Format de token invalide." });
    }

    try {
        // On verifie si le token a bien ete signe avec notre cle secrete et n'est pas expire
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // On sauvegarde les donnees de l'utilisateur (id, role) dans req.user pour pouvoir s'en servir dans les routes
        req.user = decoded; 
        
        // On dit a Express de passer a l'etape suivante (la route demandee)
        next(); 
    } catch (error) {
        return res.status(401).json({ message: "Token invalide ou expire." });
    }
};

// Middleware 2 : Verifier si l'utilisateur est un administrateur
exports.isAdmin = (req, res, next) => {
    // Attention, ce middleware doit toujours etre utilise APRES verifyToken
    // car il depend de req.user
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Privileges administrateur requis pour cette action." });
    }
    
    // Si l'utilisateur est bien un admin, on continue
    next(); 
};
