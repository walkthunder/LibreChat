const crypto = require('crypto');
const { logger } = require('@librechat/data-schemas');
const { isEnabled } = require('@librechat/api');
const { findUser, createUser, getUserById } = require('~/models');
const { SystemRoles } = require('librechat-data-provider');
const { getAppConfig } = require('~/server/services/Config');
const { setAuthTokens } = require('~/server/services/AuthService');

/**
 * Generate a consistent machine ID from browser fingerprint
 * @param {Object} fingerprint - Browser fingerprint data
 * @returns {string} - Hashed machine ID
 */
const generateMachineId = (fingerprint) => {
  const {
    userAgent,
    language,
    platform,
    screenResolution,
    timezone,
    canvas,
    webgl,
  } = fingerprint;

  const fingerprintString = JSON.stringify({
    userAgent,
    language,
    platform,
    screenResolution,
    timezone,
    canvas,
    webgl,
  });

  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
};

/**
 * Anonymous authentication middleware
 * Creates or retrieves anonymous user based on browser fingerprint
 */
const anonymousAuth = async (req, res, next) => {
  try {
    // Check if anonymous login is enabled
    if (!isEnabled(process.env.ALLOW_ANONYMOUS_LOGIN)) {
      return res.status(403).json({ 
        message: 'Anonymous login is not enabled',
        code: 'ANONYMOUS_LOGIN_DISABLED'
      });
    }

    const { fingerprint } = req.body;

    if (!fingerprint) {
      return res.status(400).json({ 
        message: 'Browser fingerprint is required',
        code: 'FINGERPRINT_REQUIRED'
      });
    }

    // Generate machine ID from fingerprint
    const machineId = generateMachineId(fingerprint);
    const anonymousEmail = `anonymous_${machineId}@librechat.local`;

    logger.info(`[anonymousAuth] Processing anonymous login [MachineID: ${machineId.substring(0, 8)}...]`);

    // Check if user already exists
    let user = await findUser({ email: anonymousEmail });

    if (!user) {
      // Create new anonymous user
      const appConfig = await getAppConfig();
      const anonymousUserData = {
        provider: 'anonymous',
        email: anonymousEmail,
        username: `anonymous_${machineId.substring(0, 8)}`,
        name: `访客用户`,
        avatar: null,
        role: SystemRoles.USER,
        password: crypto.randomBytes(32).toString('hex'), // Random password
        emailVerified: true, // Anonymous users are auto-verified
      };

      user = await createUser(anonymousUserData, appConfig.balance, true, false);
      logger.info(`[anonymousAuth] Created new anonymous user [MachineID: ${machineId.substring(0, 8)}...] [UserID: ${user?._id}]`);
      
      // Fetch the complete user object
      if (user && user._id) {
        user = await getUserById(user._id);
      }
    } else {
      logger.info(`[anonymousAuth] Found existing anonymous user [MachineID: ${machineId.substring(0, 8)}...] [UserID: ${user._id}]`);
    }

    // Verify user object has required fields
    if (!user || !user._id) {
      logger.error('[anonymousAuth] Invalid user object:', user);
      return res.status(500).json({ 
        message: 'Failed to create or retrieve user',
        code: 'USER_CREATION_FAILED'
      });
    }

    // Set user on request for next middleware
    req.user = user;
    next();
  } catch (err) {
    logger.error('[anonymousAuth] Error in anonymous authentication:', err);
    return res.status(500).json({ 
      message: 'Anonymous authentication failed',
      code: 'ANONYMOUS_AUTH_ERROR'
    });
  }
};

/**
 * Anonymous login controller
 */
const anonymousLoginController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(400).json({ message: 'Anonymous authentication failed' });
    }

    // Convert to plain object and extract user data
    const userObj = req.user.toObject ? req.user.toObject() : req.user;
    const { password: _p, totpSecret: _t, __v, ...user } = userObj;
    
    // Ensure _id exists and convert to string
    if (!user._id) {
      logger.error('[anonymousLoginController] User object missing _id:', user);
      return res.status(500).json({ message: 'User ID not found' });
    }
    
    user.id = user._id.toString();

    const token = await setAuthTokens(user._id, res);

    logger.info(`[anonymousLoginController] Anonymous login successful [UserID: ${user.id}]`);

    return res.status(200).send({ 
      token, 
      user,
      isAnonymous: true 
    });
  } catch (err) {
    logger.error('[anonymousLoginController] Error:', err.message);
    logger.error('[anonymousLoginController] Stack:', err.stack);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports = {
  anonymousAuth,
  anonymousLoginController,
  generateMachineId,
};
