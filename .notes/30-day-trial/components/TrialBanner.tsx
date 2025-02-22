"use client";

import { useTrialStatus } from "../hooks/useTrialStatus";

export function TrialBanner() {
    const status = useTrialStatus();

    if (!status?.isActive || status.daysRemaining <= 0) return null;

    return (
        <div className="fixed top-0 right-0 m-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg z-50">
            {status.daysRemaining} days left in trial
        </div>
    );
}
