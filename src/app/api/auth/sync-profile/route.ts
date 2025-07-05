import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'User ID is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Get user data from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      console.error('Error fetching user:', userError);
      throw new Error(userError?.message || 'Failed to fetch user data');
    }

    // Upsert user profile
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     user.user_metadata?.user_name ||
                     user.email?.split('@')[0] || 
                     'Anonymous User',
        avatar_url: user.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error('Error syncing profile:', upsertError);
      throw new Error(upsertError.message);
    }

    return new NextResponse(
      JSON.stringify({ success: true }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in sync-profile:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
