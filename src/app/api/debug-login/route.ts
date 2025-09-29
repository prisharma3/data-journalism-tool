import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('Debug login attempt:', { email, password: '***' });

    // Check if user exists
    const user = await getUserByEmail(email);
    console.log('User found:', user ? 'YES' : 'NO');
    
    if (!user) {
      return NextResponse.json({
        error: 'User not found',
        debug: { email, userExists: false }
      }, { status: 404 });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      return NextResponse.json({
        error: 'Invalid password',
        debug: { email, userExists: true, passwordValid: false }
      }, { status: 401 });
    }

    // Generate token
    const token = generateToken(user.id);
    console.log('Token generated:', token ? 'YES' : 'NO');

    // Return user data
    const { password_hash, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
      debug: { email, userExists: true, passwordValid: true, tokenGenerated: true }
    });

  } catch (error) {
    console.error('Debug login error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      debug: { error: error instanceof Error ? error.message : 'Unknown error' }
    }, { status: 500 });
  }
}