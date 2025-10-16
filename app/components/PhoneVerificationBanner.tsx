'use client';

import { useSession } from "next-auth/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Phone, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function PhoneVerificationBanner() {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if phone is verified or banner is dismissed
  if (session?.user?.isPhoneVerified || dismissed) {
    return null;
  }

  return (
    <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Phone className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
          <div className="flex-1">
            <AlertDescription className="text-sm">
              <span className="font-semibold text-orange-900 dark:text-orange-300">
                Verify your phone number
              </span>
              <p className="text-orange-800 dark:text-orange-400 mt-1">
                Complete your profile to unlock all features and connect with peers for mock interviews.
              </p>
              <Button 
                size="sm" 
                className="mt-3 bg-orange-600 hover:bg-orange-700"
                asChild
              >
                <Link href="/verify-phone">
                  Verify Now
                </Link>
              </Button>
            </AlertDescription>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Alert>
  );
}

