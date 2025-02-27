'use client';

import { useEffect, useState } from 'react';
import { Badge } from './badge';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export function TrialCountdown() {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkTrialStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('trial_start, trial_end')
        .eq('user_id', user.id)
        .single();

      if (subscription?.trial_end) {
        const trialEnd = new Date(subscription.trial_end);
        const now = new Date();
        const diff = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diff > 0) {
          setDaysRemaining(diff);
        }
      }
    }

    checkTrialStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        checkTrialStatus();
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setDaysRemaining(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Don't render anything if user is not logged in or no days remaining
  if (!isLoggedIn || !daysRemaining) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-50"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-900 to-yellow-700   rounded-full blur-lg group-hover:opacity-95 transition-opacity" />
          <Badge 
            variant="secondary" 
            className="bg-[#111C44]/30 relative text-lg font-semibold px-[1.6em] pb-[1.6em] pt-[1.4em] border-orange-600 border text-white  shadow-lg hover:shadow-xl transition-shadow duration-200"
          >
            <Link href="/account/billing">
            <div className=' text-shadow-md text-shadow-black'>{daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'} Left in Trial</div>
            <div className='text-xs font-mono font-normal text-center  text-shadow-md text-shadow-black'>Go To Billing Page</div>
            </Link>
          </Badge>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}