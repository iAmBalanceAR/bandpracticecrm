'use client';

import { useEffect, useState } from 'react';
import { Badge } from './badge';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export function TrialCountdown() {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function checkTrialStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

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
  }, []);

  if (!daysRemaining) return null;

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
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-400 opacity-70 rounded-full blur-lg group-hover:opacity-75 transition-opacity" />
          <Badge 
            variant="secondary" 
            className="bg-[#111C44]/30 relative text-lg font-semibold p-4 border-green-500/90 border text-white  shadow-lg hover:shadow-xl transition-shadow duration-200"
          >
            <Link href="{/account/billing">
            {daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'} Left in Trial
            </Link>
          </Badge>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}