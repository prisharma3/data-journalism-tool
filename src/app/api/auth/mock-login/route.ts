import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Mock user data for testing (no database needed)
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: email,
      first_name: 'John',
      last_name: 'Doe',
      created_at: new Date().toISOString(),
    };

    // Mock token for testing
    const mockToken = 'mock-jwt-token-for-testing';

    return NextResponse.json({
      message: 'Mock login successful',
      user: mockUser,
      token: mockToken
    });

  } catch (error) {
    console.error('Mock login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}