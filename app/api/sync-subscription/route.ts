import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/utils/stripe'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get the user's subscription from Supabase
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created', { ascending: false })
      .limit(1)
      .single()

    if (subError) {
      console.error('Error fetching subscription:', subError)
      return new NextResponse('Error fetching subscription', { status: 500 })
    }

    if (!subscription) {
      return new NextResponse('No subscription found', { status: 404 })
    }

    // Update the profile with the subscription data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: subscription.status,
        subscription_price_id: subscription.price_id,
        subscription_id: subscription.id,
        stripe_customer_id: subscription.customer_id
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return new NextResponse('Error updating profile', { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated with subscription data',
      subscription: subscription
    })
  } catch (error) {
    console.error('Sync error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 