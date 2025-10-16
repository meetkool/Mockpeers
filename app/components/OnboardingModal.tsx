'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Bot, UserPlus, GraduationCap, Code, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

interface OnboardingData {
  // experienceLevel removed - now chosen per-meeting during booking
  profession?: string;
  email?: string;
  leetcodeUsername?: string;
  interviewLanguages: string[];
  readLanguages: string[];
  questionDifficulties: string[];
}

const PROGRAMMING_LANGUAGES = [
  'C#', 'C++', 'Go', 'Java', 'JavaScript', 'Kotlin', 'Python', 'Swift', 'TypeScript'
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Very Hard'];

const PROFESSIONS = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Fullstack Developer',
  'DevOps Engineer',
  'Data Scientist',
  'ML Engineer',
  'QA Engineer',
  'Product Manager',
  'Other'
];

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [loading, setLoading] = useState(false);
  // Removed experience step - users choose experience level when booking
  const [formData, setFormData] = useState<OnboardingData>({
    interviewLanguages: [],
    readLanguages: [],
    questionDifficulties: [],
  });
  const router = useRouter();
  const { data: session } = useSession();

  const toggleLanguage = (language: string, type: 'interview' | 'read') => {
    const key = type === 'interview' ? 'interviewLanguages' : 'readLanguages';
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].includes(language)
        ? prev[key].filter(l => l !== language)
        : [...prev[key], language]
    }));
  };

  const toggleDifficulty = (difficulty: string) => {
    setFormData(prev => ({
      ...prev,
      questionDifficulties: prev.questionDifficulties.includes(difficulty)
        ? prev.questionDifficulties.filter(d => d !== difficulty)
        : [...prev.questionDifficulties, difficulty]
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.profession) {
      toast.error('Please select your profession');
      return;
    }

    if (formData.interviewLanguages.length === 0) {
      toast.error('Please select at least one language you want to interview in');
      return;
    }

    if (formData.readLanguages.length === 0) {
      toast.error('Please select at least one language you can read');
      return;
    }

    if (formData.questionDifficulties.length === 0) {
      toast.error('Please select at least one question difficulty');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to save preferences');

      toast.success('Profile preferences saved! Welcome to Mockpeers 🎉');
      onComplete();
      router.refresh();
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip: true })
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Removed experience level step - now chosen when booking meetings */}
        <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Tell us about yourself</DialogTitle>
              <DialogDescription className="text-base">
                This helps us match you with the right interview partners
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Profession */}
              <div className="space-y-3">
                <Label>
                  What&apos;s your profession? <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-2">
                  {PROFESSIONS.map(profession => (
                    <label
                      key={profession}
                      className="flex items-center space-x-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="profession"
                        value={profession}
                        checked={formData.profession === profession}
                        onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                        className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <span className="text-sm group-hover:text-primary transition-colors">
                        {profession}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={session?.user?.email || 'your@email.com'}
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!!session?.user?.email}
                />
                <p className="text-xs text-muted-foreground">
                  We&apos;ll send interview status updates to this email address.
                </p>
              </div>

              {/* LeetCode Username */}
              <div className="space-y-2">
                <Label htmlFor="leetcode">LeetCode Username</Label>
                <Input
                  id="leetcode"
                  placeholder="Your LeetCode username"
                  value={formData.leetcodeUsername || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, leetcodeUsername: e.target.value }))}
                />
              </div>

              {/* Interview Languages */}
              <div className="space-y-2">
                <Label>
                  Language(s) you want to interview in <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  You&apos;ll be paired with someone who can read one of these languages.
                </p>
                <div className="flex flex-wrap gap-2">
                  {PROGRAMMING_LANGUAGES.map(lang => (
                    <Button
                      key={lang}
                      type="button"
                      variant={formData.interviewLanguages.includes(lang) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleLanguage(lang, 'interview')}
                    >
                      {lang}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Read Languages */}
              <div className="space-y-2">
                <Label>
                  Language(s) you can read <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  You&apos;ll be paired with someone who wants to interview in one of these languages. 
                  Only select languages that you&apos;re genuinely comfortable reading.
                </p>
                <div className="flex flex-wrap gap-2">
                  {PROGRAMMING_LANGUAGES.map(lang => (
                    <Button
                      key={lang}
                      type="button"
                      variant={formData.readLanguages.includes(lang) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleLanguage(lang, 'read')}
                    >
                      {lang}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Question Difficulties */}
              <div className="space-y-2">
                <Label>
                  Question difficulties that you're willing to get <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  We recommend against selecting Easy questions, unless you&apos;re a beginner, 
                  because real coding interviews usually consist of Medium-or-harder questions.
                </p>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTIES.map(diff => (
                    <Button
                      key={diff}
                      type="button"
                      variant={formData.questionDifficulties.includes(diff) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleDifficulty(diff)}
                    >
                      {diff}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </Button>
            </div>

            <div className="flex justify-center mt-2">
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={loading}
                className="text-sm"
              >
                Skip for Now
              </Button>
            </div>
          </>
      </DialogContent>
    </Dialog>
  );
}

