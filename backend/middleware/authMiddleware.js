const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  try {
    // Token header la irukka check pannu
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, access denied' });
    }

    // "Bearer eyJhbG..." → token part மட்டும் எடு
    const token = authHeader.split(' ')[1];

    // Token verify pannu
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }

    next(); // next middleware / route ku po

  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin only routes ku
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
};

module.exports = { protect, adminOnly };