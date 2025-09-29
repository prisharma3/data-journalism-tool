import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await query('SELECT NOW() as current_time');
    
    // Test users table
    const usersTest = await query('SELECT COUNT(*) as user_count FROM users');
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection working',
      currentTime: result.rows[0].current_time,
      userCount: usersTest.rows[0].user_count,
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
    }, { status: 500 });
  }
}