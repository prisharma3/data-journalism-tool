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