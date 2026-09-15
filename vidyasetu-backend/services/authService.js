const jwt = require('jsonwebtoken');

const { database } = require('../db/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'vidyasetu-lms-dev-secret';

const selectUserByEmail = database.prepare(`
  SELECT id, name, email, role, status
  FROM users
  WHERE email = ?
`);

const selectUserById = database.prepare(`
  SELECT id, name, email, role, status
  FROM users
  WHERE id = ?
`);

const selectProviderLink = database.prepare(`
  SELECT id
  FROM user_auth_providers
  WHERE user_id = ? AND provider = ?
`);

const updateUserLastLogin = database.prepare(`
  UPDATE users
  SET last_login_at = ?
  WHERE id = ?
`);

const insertProviderLink = database.prepare(`
  INSERT INTO user_auth_providers (user_id, provider, provider_user_id, created_at)
  VALUES (?, ?, ?, ?)
`);

const insertLoginEvent = database.prepare(`
  INSERT INTO user_login_events (user_id, provider, logged_in_at)
  VALUES (?, ?, ?)
`);

const normalizeRole = (role) => {
  if (role === 'admin' || role === 'teacher' || role === 'student') {
    return role;
  }

  return 'student';
};

const signToken = (user) => jwt.sign(
  {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  },
  JWT_SECRET,
  { expiresIn: '7d' }
);

const insertUser = database.prepare(`
  INSERT INTO users (name, email, role, status, created_at, last_login_at)
  VALUES (?, ?, ?, 'active', ?, ?)
`);

const verifyGoogleIdToken = async (credential) => {
  if (!credential) {
    throw new Error('Google credential token is required');
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error_description || 'Invalid or expired Google authentication token');
  }

  const payload = await response.json();

  if (!payload.email) {
    throw new Error('Google account does not provide an email address');
  }

  if (payload.email_verified !== 'true' && payload.email_verified !== true) {
    throw new Error('Google email address has not been verified');
  }

  return {
    email: payload.email.toLowerCase().trim(),
    name: payload.name || payload.given_name || payload.email.split('@')[0],
    sub: payload.sub,
    picture: payload.picture || null,
  };
};

const googleLogin = async ({ credential }) => {
  const { email, name, sub, picture } = await verifyGoogleIdToken(credential);

  let user = selectUserByEmail.get(email);
  const timestamp = new Date().toISOString();

  if (!user) {
    // Automatically provision new student user on first Google login
    const result = insertUser.run(
      name,
      email,
      'student',
      timestamp,
      timestamp
    );
    user = selectUserById.get(Number(result.lastInsertRowid));
  } else {
    if (user.status !== 'active') {
      throw new Error('User account is currently inactive. Please contact administrator.');
    }
  }

  const providerLink = selectProviderLink.get(user.id, 'google');
  if (!providerLink) {
    insertProviderLink.run(
      user.id,
      'google',
      sub,
      timestamp
    );
  }

  updateUserLastLogin.run(timestamp, user.id);
  insertLoginEvent.run(user.id, 'google', timestamp);

  return {
    token: signToken(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: normalizeRole(user.role),
      picture,
    },
  };
};

const socialLogin = ({ provider, email, name }) => {
  if (!provider || !['google', 'facebook'].includes(provider)) {
    throw new Error('Unsupported login provider');
  }

  if (!email) {
    throw new Error('Email is required');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = selectUserByEmail.get(normalizedEmail);

  if (!user) {
    throw new Error('User not found for this social login');
  }

  if (user.status !== 'active') {
    throw new Error('User account is inactive');
  }

  const providerLink = selectProviderLink.get(user.id, provider);
  const timestamp = new Date().toISOString();

  if (!providerLink) {
    insertProviderLink.run(
      user.id,
      provider,
      `${provider}:${normalizedEmail}`,
      timestamp
    );
  }

  updateUserLastLogin.run(timestamp, user.id);
  insertLoginEvent.run(user.id, provider, timestamp);

  return {
    token: signToken(user),
    user: {
      ...user,
      role: normalizeRole(user.role),
      name: name || user.name,
    },
  };
};

const getUserById = (userId) => {
  return selectUserById.get(userId) || null;
};

module.exports = {
  getUserById,
  googleLogin,
  JWT_SECRET,
  socialLogin,
  verifyGoogleIdToken,
};
