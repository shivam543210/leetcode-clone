// Role-based authorization middleware
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Subscription-based authorization
const requireSubscription = (...allowedPlans) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedPlans.includes(req.user.subscription)) {
      return res.status(402).json({
        success: false,
        message: 'Premium subscription required',
        required: allowedPlans,
        current: req.user.subscription,
        upgradeUrl: '/subscription/upgrade'
      });
    }

    next();
  };
};

// Check if user owns resource
const verifyOwnership = (userIdField = 'userId') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const resourceUserId = req.params[userIdField] || 
                          req.body[userIdField] || 
                          req.query[userIdField];

    if (!resourceUserId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not provided'
      });
    }

    // Allow access if user owns resource or is admin
    if (req.user.userId !== resourceUserId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

module.exports = {
  authorizeRole,
  requireSubscription,
  verifyOwnership
};
