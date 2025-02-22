import { useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { useTrialStatus } from '../hooks/useTrialStatus';
import * as React from 'react';

// Trial status management
export interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  startDate: Date;
  endDate: Date;
}

// Feature flag hook
export function useFeatureFlag(flagName: string) {
  const { supabase } = useSupabase();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    async function checkFlag() {
      const { data } = await supabase
        .from("feature_flags")
        .select("is_enabled")
        .eq("flag_name", flagName)
        .single();
      
      setIsEnabled(data?.is_enabled ?? false);
    }

    checkFlag();
  }, [flagName, supabase]);

  return isEnabled;
}

// Trial banner component
export const TrialBanner: React.FC = () => {
  const trialStatus = useTrialStatus();
  
  if (!trialStatus || trialStatus.daysRemaining <= 0) {
    return null;
  }

  return React.createElement('div', 
    { className: 'fixed top-0 right-0 m-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50' },
    `${trialStatus.daysRemaining} ${trialStatus.daysRemaining === 1 ? 'day' : 'days'} remaining in trial`
  );
};

// Email notification service
export async function sendTrialNotification(userId: string) {
  const { supabase } = useSupabase();
  
  const { data: user } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();
    
  const { data: status } = await supabase
    .from('profiles')
    .select('subscription_status, created_at')
    .eq('id', userId)
    .single();
    
  if (status?.subscription_status === '30_days_no_pay') {
    const endDate = new Date(status.created_at);
    endDate.setDate(endDate.getDate() + 30);
    const daysRemaining = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 5 && user?.email) {
      await supabase.functions.invoke('send-trial-email', {
        body: {
          email: user.email,
          daysRemaining,
          template: 'trial-ending'
        }
      });
    }
  }
}
