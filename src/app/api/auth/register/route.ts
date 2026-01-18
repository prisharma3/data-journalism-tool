import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();
    
    // console.log('Registration attempt for:', email);

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
      // console.log('User already exists:', email);
      return NextResponse.json(
        { error: 'User already exists' }, 
        { status: 400 }
      );
    }

    // Create new user
    const newUser = await createUser({
      email,
      password,
      firstName,
      lastName
    });

    // console.log('User created successfully:', email);

    return NextResponse.json({
      message: 'User created successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}