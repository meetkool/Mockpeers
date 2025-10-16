"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Sparkles, Video } from "lucide-react";
import { PhoneVerificationBanner } from "@/app/components/PhoneVerificationBanner";
import { BookingModal } from "@/app/components/interviews/BookingModal";
import { format, differenceInMinutes } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UserMeeting {
  id: string;
  scheduleId: string;
  schedule: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    duration: number;
    status: string;
  };
}

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === 'ADMIN';
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [upcomingInterviews, setUpcomingInterviews] = useState<UserMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // Fetch user profile to check phone verification status
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const profile = await res.json();
          setIsPhoneVerified(profile.isPhoneVerified || false);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    if (session && !isAdmin) {
      fetchUserProfile();
    }
  }, [session, isAdmin]);

  const fetchUpcomingInterviews = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const res = await fetch('/api/meetings/upcoming');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setUpcomingInterviews(data);
      } else {
        setUpcomingInterviews([]);
      }
    } catch (error) {
      console.error('Failed to fetch upcoming interviews:', error);
      setUpcomingInterviews([]);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  // Real-time timer update every 5 seconds for responsive UI
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000); // Update every 5 seconds for real-time responsiveness

    return () => clearInterval(timer);
  }, []);

  // Fetch upcoming interviews on mount and poll every 10 seconds for real-time updates
  useEffect(() => {
    if (session?.user) {
      fetchUpcomingInterviews(true); // Show loader on initial fetch
      
      // Poll for updates every 10 seconds for real-time responsiveness
      const pollInterval = setInterval(() => {
        fetchUpcomingInterviews(false);
      }, 10000); // Reduced from 30s to 10s for better real-time updates

      return () => clearInterval(pollInterval);
    } else if (session === null) {
      setLoading(false);
    }
  }, [session, fetchUpcomingInterviews]);

  const handleCancelInterview = async (meetingId: string) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to cancel');
      }

      // Show success message
      toast.success('Interview cancelled successfully');

      // Refresh the list
      setUpcomingInterviews(prev => prev.filter(m => m.id !== meetingId));
    } catch (error) {
      console.error('Failed to cancel interview:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel interview';
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <BookingModal 
        open={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onBookingSuccess={() => fetchUpcomingInterviews(false)}
      />

      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section - Compact */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Prepare for your next tech interview with peer practice and AI feedback
              </p>
            </div>
            {!isAdmin && (
              <div className="flex gap-3 flex-wrap">
                <Button 
                  onClick={() => {
                    if (!isPhoneVerified) {
                      toast.error('Please verify your phone number to schedule interviews');
                      return;
                    }
                    setShowBookingModal(true);
                  }} 
                  disabled={!isPhoneVerified}
                  className="bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schedule Interview
                </Button>
                <Button 
                  variant="outline"
                  disabled={!isPhoneVerified}
                  onClick={() => {
                    if (!isPhoneVerified) {
                      toast.error('Please verify your phone number to use AI interviews');
                      return;
                    }
                    toast.info('AI Interview coming soon!');
                  }}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Interview
                </Button>
              </div>
            )}
          </div>

          {/* Phone Verification Banner */}
          {!isAdmin && <PhoneVerificationBanner />}

          {/* Stats Grid - Clean Minimal Design */}
          {!isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Credits Card */}
              <Card className="border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Interview Credits</span>
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">4</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold">4</div>
                  <p className="text-xs text-muted-foreground mt-1">Credits remaining</p>
                </CardContent>
              </Card>

              {/* Upcoming Count */}
              <Card className="border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Upcoming</span>
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CalendarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold">{upcomingInterviews.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Scheduled interviews</p>
                </CardContent>
              </Card>

              {/* Total Interviews */}
              <Card className="border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Total</span>
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Video className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold">{upcomingInterviews.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total sessions</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Admin Warning */}
          {isAdmin && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 mb-6">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Admin Mode:</strong> You cannot book interviews. Use a regular user account to participate in mock interviews.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Interviews */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Interviews</h2>
              <Button variant="link" size="sm" className="text-sm text-muted-foreground hover:text-primary">
                Test AV
              </Button>
            </div>

            {loading ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
                  <p className="text-sm text-muted-foreground">Loading interviews...</p>
                </CardContent>
              </Card>
            ) : upcomingInterviews.length === 0 ? (
              <Card className="border-0 shadow-sm bg-white/50 dark:bg-gray-900/50">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No scheduled interviews</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                    {isAdmin 
                      ? 'Admins cannot book interviews. Please use a regular user account.'
                      : 'Book your first mock interview and start practicing today!'}
                  </p>
                  {!isAdmin && (
                    <Button onClick={() => setShowBookingModal(true)} size="lg">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Schedule Your First Interview
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-gray-200 dark:border-gray-800">
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {upcomingInterviews.map((meeting, index) => {
                      const now = currentTime;
                      const startTime = new Date(meeting.schedule.startTime);
                      const endTime = new Date(meeting.schedule.endTime);
                      const isActive = now >= startTime && now < endTime;
                      const minutesToStart = differenceInMinutes(startTime, now);
                      
                      return (
                        <div 
                          key={meeting.id} 
                          className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {/* Date Circle Icon */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                              isActive 
                                ? 'bg-orange-100 dark:bg-orange-900/30' 
                                : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                              <CalendarIcon className={`h-5 w-5 ${
                                isActive 
                                  ? 'text-orange-600 dark:text-orange-400' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`} />
                            </div>

                            {/* Meeting Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-sm truncate">
                                  {meeting.schedule.title}
                                </h3>
                                {isActive && (
                                  <Badge className="bg-orange-100 text-orange-800 border-0 dark:bg-orange-900 dark:text-orange-200 text-xs">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mr-1 animate-pulse"></div>
                                    Live Now
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  Due {format(startTime, 'MM/dd/yyyy')}
                                </span>
                                <span>
                                  {format(startTime, 'h:mm a')}
                                </span>
                                {!isActive && minutesToStart < 60 && minutesToStart > 0 && (
                                  <span className="text-green-600 dark:text-green-400 font-medium">
                                    Starts in {minutesToStart}m
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!isActive && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-xs text-muted-foreground hover:text-primary"
                                onClick={() => {
                                  // Add to calendar functionality
                                  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meeting.schedule.title)}&dates=${format(startTime, "yyyyMMdd'T'HHmmss")}/${format(endTime, "yyyyMMdd'T'HHmmss")}&details=${encodeURIComponent('Mock Interview Session')}`;
                                  window.open(calendarUrl, '_blank');
                                }}
                              >
                                Add to calendar
                              </Button>
                            )}
                            {isActive || meeting.schedule.status === 'ACTIVE' ? (
                              <Button 
                                size="sm"
                                onClick={() => router.push(`/rooms/${meeting.schedule.id}`)}
                                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                              >
                                <Video className="h-4 w-4 mr-1.5" />
                                Join Now
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleCancelInterview(meeting.id)}
                                className="text-muted-foreground hover:text-destructive text-xs"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
