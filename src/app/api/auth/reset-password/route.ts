import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, updateUserPassword, getUserPasswordHash, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, newPassword } = await request.json();

    // Validate all fields are present
    if (!email || !firstName || !lastName || !newPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Get user by email
    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'Details do not match our records' },
        { status: 400 }
      );
    }

    // Verify first name and last name match (case-insensitive)
    const firstNameMatch = user.first_name.toLowerCase() === firstName.toLowerCase();
    const lastNameMatch = user.last_name.toLowerCase() === lastName.toLowerCase();

    if (!firstNameMatch || !lastNameMatch) {
      return NextResponse.json(
        { error: 'Details do not match our records' },
        { status: 400 }
      );
    }

    // Check that new password is different from old password
    const currentHash = await getUserPasswordHash(user.id);
    if (currentHash) {
      const isSamePassword = await verifyPassword(newPassword, currentHash);
      if (isSamePassword) {
        return NextResponse.json(
          { error: 'New password cannot be the same as your old password' },
          { status: 400 }
        );
      }
    }

    // Update the password
    await updateUserPassword(user.id, newPassword);

    return NextResponse.json({
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}