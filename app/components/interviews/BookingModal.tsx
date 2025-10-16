'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  Network, 
  MessageSquare, 
  Database, 
  Brain, 
  Monitor,
  Users,
  UserPlus,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format, differenceInMinutes } from 'date-fns';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  onBookingSuccess?: () => void;
}

type InterviewType = 'DSA' | 'SYSTEM_DESIGN' | 'BEHAVIORAL' | 'SQL' | 'DATA_SCIENCE' | 'FRONTEND';
type PracticeType = 'PEER' | 'FRIEND' | 'EXPERT';
type ExperienceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

const interviewTypes = [
  { 
    id: 'DSA' as InterviewType, 
    title: 'Data Structures & Algorithms', 
    description: 'Practice coding questions.',
    icon: Code,
    color: 'blue'
  },
  { 
    id: 'SYSTEM_DESIGN' as InterviewType, 
    title: 'System Design', 
    description: 'Practice designing technical architectures.',
    icon: Network,
    color: 'purple'
  },
  { 
    id: 'BEHAVIORAL' as InterviewType, 
    title: 'Behavioral', 
    description: 'Practice questions about your work experiences.',
    icon: MessageSquare,
    color: 'green'
  },
  { 
    id: 'SQL' as InterviewType, 
    title: 'SQL', 
    description: 'Practice writing and optimizing SQL queries.',
    icon: Database,
    color: 'orange',
    badge: 'Beta'
  },
  { 
    id: 'DATA_SCIENCE' as InterviewType, 
    title: 'Data Science & ML', 
    description: 'Practice using data to answer questions and design systems.',
    icon: Brain,
    color: 'pink',
    badge: 'Beta'
  },
  { 
    id: 'FRONTEND' as InterviewType, 
    title: 'Frontend', 
    description: 'Practice JavaScript with foundational exercises.',
    icon: Monitor,
    color: 'cyan',
    badge: 'Beta'
  },
];

const practiceTypes = [
  {
    id: 'PEER' as PracticeType,
    title: 'Practice with peers',
    description: 'Free mock interviews with other users where you take turns asking questions.',
    icon: Users,
  },
  {
    id: 'FRIEND' as PracticeType,
    title: 'Practice with a friend',
    description: 'Invite a friend and practice on your own schedule at any time.',
    icon: UserPlus,
  },
  {
    id: 'EXPERT' as PracticeType,
    title: 'Expert mock interview',
    description: 'Get interviewed 1-1 by an expert coach with FAANG+ experience.',
    icon: Briefcase,
  },
];

const experienceLevels = [
  {
    id: 'BEGINNER' as ExperienceLevel,
    title: 'Beginner',
    subtitle: '0-2 years of experience',
    description: 'Perfect for those new to technical interviews.',
  },
  {
    id: 'INTERMEDIATE' as ExperienceLevel,
    title: 'Intermediate',
    subtitle: '2-5 years of experience',
    description: 'Suitable for those with some interview experience.',
  },
  {
    id: 'ADVANCED' as ExperienceLevel,
    title: 'Advanced',
    subtitle: '5+ years of experience',
    description: 'For experienced developers seeking challenging practice.',
  },
];

export function BookingModal({ open, onClose, onBookingSuccess }: BookingModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<InterviewType | null>(null);
  const [selectedPractice, setSelectedPractice] = useState<PracticeType | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [availableSchedules, setAvailableSchedules] = useState<any[]>([]);

  // Helper function to check if user has already booked a schedule
  const isUserAlreadyBooked = (schedule: any) => {
    if (!session?.user?.id) return false;
    return schedule.userMeetings?.some((meeting: any) => meeting.userId === session.user.id) || false;
  };

  const handleInterviewTypeSelect = (type: InterviewType) => {
    setSelectedType(type);
    setStep(2);
  };

  const handlePracticeTypeSelect = (type: PracticeType) => {
    if (type === 'PEER') {
      setSelectedPractice(type);
      setStep(3);
    } else {
      // Show coming soon message for FRIEND and EXPERT
      toast.info('Coming soon! This feature is currently under development.');
    }
  };

  const handleLevelSelect = async (level: ExperienceLevel) => {
    setSelectedLevel(level);
    setLoading(true);
    try {
      // Fetch available schedules
      const res = await fetch('/api/schedule');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAvailableSchedules(data);
      }
      setStep(4);
    } catch (error) {
      toast.error('Failed to load available times');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSelect = (schedule: any) => {
    setSelectedSchedule(schedule);
    setStep(5);
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schedule/${selectedSchedule.id}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewType: selectedType,
          practiceType: selectedPractice,
          experienceLevel: selectedLevel,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to book');
      }

      toast.success('Interview booked successfully! 🎉');
      onBookingSuccess?.(); // Trigger callback to refresh data
      onClose();
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to book interview';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedType(null);
    setSelectedPractice(null);
    setSelectedLevel(null);
    setSelectedSchedule(null);
    onClose();
  };

  const groupSchedulesByDate = () => {
    const groups: Record<string, any[]> = {};
    availableSchedules.forEach(schedule => {
      const date = format(new Date(schedule.startTime), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(schedule);
    });
    return groups;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Step 1: Interview Type */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Select your interview type</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {interviewTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.id}
                    className="cursor-pointer hover:shadow-lg transition-all hover:border-primary"
                    onClick={() => handleInterviewTypeSelect(type.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Icon className="h-6 w-6 mt-1" />
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {type.title}
                              {type.badge && <Badge variant="secondary">{type.badge}</Badge>}
                            </CardTitle>
                            <CardDescription className="mt-1">{type.description}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Step 2: Practice Type */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Select your practice type</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {practiceTypes.map((type) => {
                const Icon = type.icon;
                const isComingSoon = type.id !== 'PEER';
                return (
                  <Card
                    key={type.id}
                    className={`cursor-pointer hover:shadow-lg transition-all ${
                      isComingSoon 
                        ? 'opacity-75 hover:border-gray-300' 
                        : 'hover:border-primary'
                    }`}
                    onClick={() => handlePracticeTypeSelect(type.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <Icon className="h-6 w-6 mt-1" />
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {type.title}
                              {isComingSoon && (
                                <Badge variant="secondary" className="text-xs">
                                  Coming Soon
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="mt-1">{type.description}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={handleBack}>Back</Button>
            </div>
          </>
        )}

        {/* Step 3: Experience Level */}
        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Select your experience level</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {experienceLevels.map((level) => (
                <Card
                  key={level.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-primary"
                  onClick={() => handleLevelSelect(level.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{level.title}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-semibold">{level.subtitle}</p>
                      <p className="mt-1">{level.description}</p>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={handleBack}>Back</Button>
            </div>
          </>
        )}

        {/* Step 4: Time Selection */}
        {step === 4 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Select a time to practice</DialogTitle>
              <p className="text-sm text-muted-foreground">All times shown in your local timezone</p>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {availableSchedules.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No available time slots at the moment.</p>
                  </CardContent>
                </Card>
              ) : (
                Object.entries(groupSchedulesByDate()).map(([date, schedules]) => (
                  <div key={date}>
                    <h3 className="font-semibold mb-2">
                      {format(new Date(date), 'EEEE, MMMM dd')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {schedules.map((schedule) => {
                        const minutesToStart = differenceInMinutes(
                          new Date(schedule.startTime),
                          new Date()
                        );
                        const alreadyBooked = isUserAlreadyBooked(schedule);
                        // If bookingOpen is true, admin has allowed booking (overrides time restriction)
                        const isDisabled = alreadyBooked;

                        return (
                          <Button
                            key={schedule.id}
                            variant="outline"
                            onClick={() => !isDisabled && handleScheduleSelect(schedule)}
                            disabled={isDisabled}
                            className={`flex items-center gap-2 ${
                              isDisabled 
                                ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50' 
                                : 'hover:bg-primary hover:text-primary-foreground'
                            }`}
                          >
                            <Clock className="h-4 w-4" />
                            {format(new Date(schedule.startTime), 'hh:mm a')}
                            {minutesToStart < 20 && minutesToStart > 0 && (
                              <span className="text-xs text-orange-600 dark:text-orange-400 ml-1">
                                Starts in {minutesToStart}m
                              </span>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={handleBack}>Back</Button>
            </div>
          </>
        )}

        {/* Step 5: Confirmation */}
        {step === 5 && selectedSchedule && (
          <>
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-2xl mb-4">Your interview is confirmed!</DialogTitle>
              
              <div className="space-y-4 text-left max-w-lg mx-auto">
                <Card>
                  <CardContent className="flex gap-3 pt-6">
                    <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      Your <strong>{interviewTypes.find(t => t.id === selectedType)?.title}</strong> interview is{' '}
                      <strong>{format(new Date(selectedSchedule.startTime), 'EEEE, MMMM dd, yyyy')}</strong> at{' '}
                      <strong>{format(new Date(selectedSchedule.startTime), 'hh:mm a')}</strong>.
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex gap-3 pt-6">
                    <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      Review the questions beforehand and arrive on time.
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex gap-3 pt-6">
                    <Users className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      Be respectful to your partner. Please arrive on time and take turns.
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-3 justify-center mt-6">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button onClick={handleConfirmBooking} disabled={loading}>
                  {loading ? 'Confirming...' : 'Confirm Booking'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

