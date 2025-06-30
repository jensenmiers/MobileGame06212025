import { NextResponse } from 'next/server';
import { database, testConnection } from '@/lib/database';

export async function GET() {
  try {
    // Test the database connection
    const connection = await testConnection();
    
    if (!connection.connected) {
      console.error('Database connection error:', connection.error);
      const errorMessage = connection.error instanceof Error 
        ? connection.error.message 
        : 'Unknown error';
        
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Database connection failed', 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            urlPresent: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            anonKeyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            serviceKeyPresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            nodeEnv: process.env.NODE_ENV
          } : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      status: 'ok',
      database: 'connected',
      tournaments: connection.data?.length || 0,
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV === 'development' ? {
        nodeEnv: process.env.NODE_ENV,
        hasEnvVars: {
          url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      } : undefined
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Health check failed', error: String(error) },
      { status: 500 }
    );
  }
}
