export type TrialStatus = {
    isActive: boolean;
    daysRemaining: number;
    startDate: Date;
    endDate: Date;
};

export type NotificationType = 'trial_start' | 'trial_ending' | 'trial_expired';

export type TrialNotification = {
    id: string;
    userId: string;
    type: "trial_start" | "trial_ending" | "trial_expired";
    sentAt: Date;
    daysRemaining: number;
};
