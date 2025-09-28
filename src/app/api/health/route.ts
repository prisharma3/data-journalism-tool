import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      message: 'API is running successfully'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'error',
      message: 'API health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}