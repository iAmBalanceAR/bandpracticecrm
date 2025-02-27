'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export default function StripeTestButton() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const handleTestStripe = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error", 
          description: "You must be logged in to test Stripe",
          variant: "destructive"
        });
        return;
      }

      console.log('Creating test webhook with user ID:', user.id);

      // Call your webhook directly with test data
      const response = await fetch('/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: `evt_test_${Date.now()}`,
          object: "event",
          api_version: "2023-10-16",
          created: Math.floor(Date.now() / 1000),
          type: 'customer.subscription.created',
          data: {
            object: {
              id: `sub_test_${Date.now()}`,
              object: "subscription",
              status: 'trialing',
              customer: `cus_test_${Date.now()}`,
              items: {
                object: "list",
                data: [
                  {
                    id: `si_test_${Date.now()}`,
                    object: "subscription_item",
                    price: {
                      id: 'price_test_monthly',
                      object: "price",
                      active: true,
                      product: "prod_test",
                      recurring: {
                        interval: "month",
                        interval_count: 1
                      }
                    },
                    quantity: 1
                  }
                ],
                has_more: false,
                total_count: 1
              },
              current_period_start: Math.floor(Date.now() / 1000),
              current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
              trial_start: Math.floor(Date.now() / 1000),
              trial_end: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60,
              metadata: {
                supabase_user_id: user.id
              }
            }
          }
        })
      });

      const responseText = await response.text();
      console.log('Webhook response:', responseText);

      if (response.ok) {
        toast({
          title: "Success",
          description: "Stripe webhook test completed successfully",
        });
      } else {
        toast({
          title: "Error",
          description: `Webhook test failed: ${responseText}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error testing Stripe:', error);
      toast({
        title: "Error",
        description: `Failed to test Stripe: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleTestStripe} 
      disabled={isLoading}
      variant="outline"
      className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
    >
      {isLoading ? "Testing..." : "Test Stripe Webhook"}
    </Button>
  );
} 