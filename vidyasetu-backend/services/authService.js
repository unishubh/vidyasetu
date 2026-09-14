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
  JWT_SECRET,
  socialLogin,
};
