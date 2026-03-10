const { createAuditLog } = require('../controllers/auditController');

const getEntityType = (reqPath) => {
  const segments = reqPath.split('/').filter(Boolean);
  if (segments.length < 2) return 'system';

  // reqPath format typically: /api/<entity>/...
  if (segments[0] === 'api') {
    if (segments[1] === 'textile' && segments[2]) {
      return `textile_${segments[2]}`;
    }
    if ((segments[1] === 'analytics' || segments[1] === 'procurement' || segments[1] === 'crm' || segments[1] === 'hr') && segments[2]) {
      return `${segments[1]}_${segments[2]}`;
    }
    return segments[1];
  }

  return segments[0];
};

const getAction = (reqPath, method) => {
  if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && reqPath.includes('/import')) {
    return 'import';
  }
  if (method === 'GET' && reqPath.startsWith('/api/export')) return 'export';
  if (method === 'POST') return 'create';
  if (method === 'PUT' || method === 'PATCH') return 'update';
  if (method === 'DELETE') return 'delete';
  return null;
};

module.exports = (req, res, next) => {
  const reqPath = req.originalUrl.split('?')[0];

  // Skip non-API, audit endpoints, and auth endpoints (auth is handled explicitly where needed).
  if (!reqPath.startsWith('/api/') || reqPath.startsWith('/api/audit') || reqPath.startsWith('/api/auth')) {
    return next();
  }

  const action = getAction(reqPath, req.method);
  if (!action) {
    return next();
  }

  res.on('finish', () => {
    if (res.statusCode < 200 || res.statusCode >= 400) {
      return;
    }

    const entityType = getEntityType(reqPath);
    const rawEntityId = req.params?.id || req.params?.entityId || req.params?.userId || null;
    const entityId =
      typeof rawEntityId === 'string' && /^[a-fA-F0-9]{24}$/.test(rawEntityId)
        ? rawEntityId
        : null;

    const payload = {
      user: req.user?._id || null,
      action,
      entityType,
      entityId,
      description: `${action.toUpperCase()} ${entityType}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };

    createAuditLog(payload).catch((err) => {
      console.error('Audit middleware logging failed:', err?.message || err);
    });
  });

  next();
};
