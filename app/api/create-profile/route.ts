import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get the user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created', { ascending: false })
      .limit(1)
      .single()

    if (subError) {
      console.error('Error fetching subscription:', subError)
    }

    // Create profile with subscription data if available
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        subscription_status: subscription?.status || null,
        subscription_price_id: subscription?.price_id || null,
        subscription_id: subscription?.id || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return new NextResponse('Error creating profile', { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile created/updated successfully',
      profile: profile
    })
  } catch (error) {
    console.error('Profile creation error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 