import { createClient } from "@supabase/supabase-js";

export async function sendTrialNotification(userId: string) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );

    const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, created_at, email")
        .eq("id", userId)
        .single();

    if (profile?.subscription_status === "30_days_no_pay") {
        const endDate = new Date(profile.created_at);
        endDate.setDate(endDate.getDate() + 30);
        const daysRemaining = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 5) {
            // Send email notification
            await supabase.functions.invoke("send-trial-email", {
                body: { 
                    email: profile.email,
                    daysRemaining,
                    type: "trial_ending"
                }
            });

            // Log notification
            await supabase
                .from("trial_notifications")
                .insert({
                    user_id: userId,
                    notification_type: "trial_ending",
                    days_remaining: daysRemaining
                });
        }
    }
}
