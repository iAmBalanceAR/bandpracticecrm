import { useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-client-provider";
import { TrialStatus } from "../types/trial";

export function useTrialStatus() {
    const { supabase } = useSupabase();
    const [status, setStatus] = useState<TrialStatus | null>(null);

    useEffect(() => {
        async function checkStatus() {
            const { data: profile } = await supabase
                .from("profiles")
                .select("subscription_status, created_at")
                .single();

            if (profile?.subscription_status === "30_days_no_pay") {
                const startDate = new Date(profile.created_at);
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 30);
                
                setStatus({
                    isActive: true,
                    daysRemaining: Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                    startDate,
                    endDate
                });
            }
        }

        checkStatus();
    }, [supabase]);

    return status;
}
