/**
 * Simple but effective API Key authentication middleware.
 * Admin Panel must send: Authorization: Bearer <API_SECRET_KEY>
 * or Header: x-api-key: <API_SECRET_KEY>
 */
function authenticate(req, res, next) {
  const apiKey = process.env.API_SECRET_KEY;

  if (!apiKey || apiKey === 'your_super_secret_api_key_here_change_this_immediately') {
    console.error('❌ API_SECRET_KEY is not properly configured');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error',
    });
  }

  // Support both Authorization: Bearer <key> and x-api-key header
  const authHeader = req.headers['authorization'];
  const xApiKey = req.headers['x-api-key'];

  let providedKey = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedKey = authHeader.slice(7).trim();
  } else if (xApiKey) {
    providedKey = xApiKey.trim();
  }

  if (!providedKey || providedKey !== apiKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Invalid or missing API key.',
    });
  }

  next();
}

module.exports = { authenticate };
