import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

export async function getUserByEmail(email: string) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function createUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const hashedPassword = await hashPassword(userData.password);
  
  const result = await query(
    'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name, created_at',
    [userData.email, hashedPassword, userData.firstName, userData.lastName]
  );
  
  return result.rows[0];
}

// Generate a random 5-digit code
export function generateResetCode(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Create a password reset code in database
export async function createPasswordResetCode(email: string, userId: string): Promise<string> {
  const code = generateResetCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  
  // Invalidate any existing codes for this email
  await query(
    'UPDATE password_reset_codes SET used = TRUE WHERE email = $1 AND used = FALSE',
    [email]
  );
  
  // Create new code
  await query(
    'INSERT INTO password_reset_codes (user_id, email, code, expires_at) VALUES ($1, $2, $3, $4)',
    [userId, email, code, expiresAt]
  );
  
  return code;
}

// Verify a password reset code
export async function verifyResetCode(email: string, code: string): Promise<{ valid: boolean; userId?: string }> {
  const result = await query(
    `SELECT user_id FROM password_reset_codes 
     WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()`,
    [email, code]
  );
  
  if (result.rows.length === 0) {
    return { valid: false };
  }
  
  return { valid: true, userId: result.rows[0].user_id };
}

// Mark code as used
export async function markCodeAsUsed(email: string, code: string): Promise<void> {
  await query(
    'UPDATE password_reset_codes SET used = TRUE WHERE email = $1 AND code = $2',
    [email, code]
  );
}

// Update user password
export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const hashedPassword = await hashPassword(newPassword);
  await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [hashedPassword, userId]
  );
}

// Get user's current password hash (for comparison)
export async function getUserPasswordHash(userId: string): Promise<string | null> {
  const result = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.password_hash || null;
}