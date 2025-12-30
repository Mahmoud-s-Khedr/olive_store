const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { generateToken, addHours } = require('../utils/tokens');
const emailService = require('../services/emailService');
const { withTransaction } = require('../utils/transaction');

function signToken(user) {
  return jwt.sign(
    { id: user.id, is_admin: user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function register(req, res) {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim();

  const existingEmail = await User.findByEmail(normalizedEmail);
  if (existingEmail) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const existingPhone = await User.findByPhone(normalizedPhone);
  if (existingPhone) {
    return res.status(409).json({ message: 'Phone already in use' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const emailToken = generateToken();
  const emailTokenExpires = addHours(24);

  const user = await withTransaction((client) => User.createUser({
    name,
    email: normalizedEmail,
    phone: normalizedPhone,
    hashedPassword,
    emailToken,
    emailTokenExpires,
  }, client));

  await emailService.sendVerificationEmail(user, emailToken);

  res.status(201).json({
    message: 'Registration successful. Please verify your email.',
    user,
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findByEmail(email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const passwordOk = await bcrypt.compare(password, user.hashed_password);
  if (!passwordOk) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!user.email_verified) {
    return res.status(403).json({ message: 'Email not verified' });
  }

  const token = signToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      is_admin: user.is_admin,
      email_verified: user.email_verified,
    },
  });
}

async function verifyEmail(req, res) {
  const { token } = req.params;

  const user = await User.findByEmailToken(token);
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  await withTransaction((client) => User.verifyEmail(user.id, client));
  res.json({ message: 'Email verified successfully' });
}

async function resendVerification(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const user = await User.findByEmail(email.trim().toLowerCase());
  if (!user) {
    return res.status(200).json({ message: 'If the email exists, a link will be sent' });
  }

  if (user.email_verified) {
    return res.status(400).json({ message: 'Email already verified' });
  }

  const emailToken = generateToken();
  const emailTokenExpires = addHours(24);
  await withTransaction((client) => User.setEmailToken(user.id, emailToken, emailTokenExpires, client));
  await emailService.sendVerificationEmail(user, emailToken);

  res.json({ message: 'Verification email resent' });
}

async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const user = await User.findByEmail(email.trim().toLowerCase());
  if (!user) {
    return res.status(200).json({ message: 'If the email exists, a reset link will be sent' });
  }

  const resetToken = generateToken();
  const resetExpires = addHours(2);
  await withTransaction((client) => User.setPasswordResetToken(user.id, resetToken, resetExpires, client));
  await emailService.sendPasswordResetEmail(user, resetToken);

  res.json({ message: 'If the email exists, a reset link will be sent' });
}

async function resetPassword(req, res) {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and password are required' });
  }

  const user = await User.findByPasswordResetToken(token);
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await withTransaction((client) => User.updatePassword(user.id, hashedPassword, client));

  res.json({ message: 'Password updated successfully' });
}

async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({ user });
}

async function updateProfile(req, res) {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ message: 'Name and phone are required' });
  }

  const normalizedPhone = phone.trim();
  const existingPhone = await User.findByPhone(normalizedPhone);
  if (existingPhone && existingPhone.id !== req.user.id) {
    return res.status(409).json({ message: 'Phone already in use' });
  }

  const user = await withTransaction((client) => User.updateProfile(req.user.id, { name, phone: normalizedPhone }, client));
  res.json({ user });
}

async function changePassword(req, res) {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Current and new password are required' });
  }

  const user = await User.findByIdWithPassword(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const passwordOk = await bcrypt.compare(current_password, user.hashed_password);
  if (!passwordOk) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  const hashedPassword = await bcrypt.hash(new_password, 10);
  await withTransaction((client) => User.updatePassword(user.id, hashedPassword, client));

  res.json({ message: 'Password updated successfully' });
}

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  me,
  updateProfile,
  changePassword,
};
