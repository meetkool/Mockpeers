'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Bot, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleModeSelect = async (mode: 'PEER' | 'AI' | 'FRIEND') => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredMode: mode })
      });

      if (!res.ok) throw new Error('Failed to save preference');

      toast.success('Preference saved! Welcome to Mockpeers 🎉');
      onComplete();
      router.refresh();
    } catch (error) {
      toast.error('Failed to save preference');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      // Mark onboarding as completed without setting a preference
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredMode: null })
      });

      if (!res.ok) throw new Error('Failed to skip');

      onComplete();
      router.refresh();
    } catch (error) {
      toast.error('Failed to skip');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // When closing with X button, mark as skipped
    handleSkip();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Mockpeers! 🎉</DialogTitle>
          <DialogDescription className="text-base">
            Choose your preferred practice mode to get started (you can skip this for now)
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {/* Practice with Peers */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:border-blue-500" 
            onClick={() => !loading && handleModeSelect('PEER')}
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <CardTitle className="text-lg">Practice with Peers</CardTitle>
              <CardDescription className="text-sm">
                Connect with other developers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-muted-foreground mb-4">
                <li>• Match with similar experience</li>
                <li>• Give and receive feedback</li>
                <li>• Build your network</li>
              </ul>
              <Button 
                className="w-full" 
                disabled={loading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleModeSelect('PEER');
                }}
              >
                {loading ? 'Setting up...' : 'Choose Peers'}
              </Button>
            </CardContent>
          </Card>

          {/* Practice with AI */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:border-purple-500 border-2 border-purple-300" 
            onClick={() => !loading && handleModeSelect('AI')}
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-3">
                <Bot className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <CardTitle className="text-lg">Practice with AI</CardTitle>
              <CardDescription className="text-sm">
                Premium AI-powered interviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-muted-foreground mb-4">
                <li>• Realistic AI interviewer</li>
                <li>• Instant feedback</li>
                <li>• Available 24/7</li>
              </ul>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700" 
                disabled={loading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleModeSelect('AI');
                }}
              >
                {loading ? 'Setting up...' : 'Choose AI'}
              </Button>
            </CardContent>
          </Card>

          {/* Practice with Friend */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all hover:border-green-500" 
            onClick={() => !loading && handleModeSelect('FRIEND')}
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center mb-3">
                <UserPlus className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <CardTitle className="text-lg">Practice with a Friend</CardTitle>
              <CardDescription className="text-sm">
                Invite someone you know
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-muted-foreground mb-4">
                <li>• Send direct invitations</li>
                <li>• Comfortable environment</li>
                <li>• Custom format</li>
              </ul>
              <Button 
                className="w-full" 
                variant="outline" 
                disabled={loading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleModeSelect('FRIEND');
                }}
              >
                {loading ? 'Setting up...' : 'Choose Friend'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-center gap-2 mt-4">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={loading}
            className="text-sm"
          >
            Skip for Now
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            You can change this anytime from your profile settings
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

