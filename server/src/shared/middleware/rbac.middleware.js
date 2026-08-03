// Role-based access control middleware
// Usage: authorizeRoles('counselor', 'admin')
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is attached by previous authentication middleware
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user's role is permitted
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    next();
  };
};

module.exports = { authorizeRoles };
