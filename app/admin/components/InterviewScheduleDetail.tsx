"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format, differenceInMinutes } from "date-fns";
import { ArrowLeft, ArrowRight, RefreshCw, Ban, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { 
  InterviewType, 
  INTERVIEW_TYPE_CONFIG, 
  Schedule 
} from "@/lib/types/interview-types";

interface InterviewScheduleDetailProps {
  interviewType: InterviewType;
  scheduleId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const getStatusBadge = (status: Schedule['status']) => {
  const variants = {
    'PENDING': { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    'BOOKING_STARTED': { variant: 'default' as const, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    'ACTIVE': { variant: 'default' as const, className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    'DONE': { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
    'OVER': { variant: 'destructive' as const, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    'CANCELLED': { variant: 'outline' as const, className: 'bg-gray-50 text-gray-600' },
  };

  const config = variants[status];
  return <Badge variant={config.variant} className={config.className}>{status}</Badge>;
};

const getBookingStatus = (schedule: Schedule) => {
  const now = new Date();
  const startTime = new Date(schedule.startTime);
  const minutesToStart = differenceInMinutes(startTime, now);
  
  if (schedule.status === 'ACTIVE' || schedule.status === 'DONE' || schedule.status === 'OVER') {
    return { isOpen: false, label: 'Closed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
  }
  
  if (schedule.bookingOpen === false) {
    return { isOpen: false, label: 'Closed (Manual)', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
  }
  
  if (schedule.bookingOpen === true) {
    if (minutesToStart < 20) {
      return { isOpen: true, label: `Open (${minutesToStart}m)`, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    }
    return { isOpen: true, label: 'Open', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  }
  
  return { isOpen: false, label: 'Closed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
};

export function InterviewScheduleDetail({ 
  interviewType, 
  scheduleId 
}: InterviewScheduleDetailProps) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const config = INTERVIEW_TYPE_CONFIG[interviewType];

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`/api/admin/schedule/${scheduleId}`);
      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      toast.error('Failed to fetch schedule details');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  useEffect(() => {
    fetchSchedule();
    fetchUsers();
  }, [scheduleId]);

  const handleReopenBooking = async () => {
    if (!schedule) return;
    setActionLoading('reopen');
    try {
      const res = await fetch(`/api/admin/schedule/${schedule.id}/reopen`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to reopen booking');

      toast.success('Booking reopened successfully');
      fetchSchedule();
    } catch (error) {
      console.error('Failed to reopen booking:', error);
      toast.error('Failed to reopen booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseBooking = async () => {
    if (!schedule) return;
    setActionLoading('close');
    try {
      const res = await fetch(`/api/admin/schedule/${schedule.id}/close`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to close booking');

      toast.success('Booking closed successfully');
      fetchSchedule();
    } catch (error) {
      console.error('Failed to close booking:', error);
      toast.error('Failed to close booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndMeeting = async () => {
    if (!schedule) return;
    setActionLoading('end');
    try {
      const res = await fetch(`/api/admin/schedule/${schedule.id}/end`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to end meeting');

      toast.success('Meeting ended successfully');
      fetchSchedule();
    } catch (error) {
      console.error('Failed to end meeting:', error);
      toast.error('Failed to end meeting');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddUser = async () => {
    if (!schedule || !selectedUserId) return;
    setActionLoading('add-user');
    try {
      const res = await fetch(`/api/admin/schedule/${schedule.id}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedUserId, 
          experienceLevel: selectedExperienceLevel 
        }),
      });

      if (!res.ok) throw new Error('Failed to add user');

      toast.success('User added successfully');
      fetchSchedule();
      setIsAddUserOpen(false);
      setSelectedUserId('');
    } catch (error) {
      console.error('Failed to add user:', error);
      toast.error('Failed to add user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveUser = async (userMeetingId: string) => {
    if (!schedule) return;
    setActionLoading(userMeetingId);
    try {
      const res = await fetch(`/api/admin/schedule/${schedule.id}/users/${userMeetingId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove user');

      toast.success('User removed successfully');
      fetchSchedule();
    } catch (error) {
      console.error('Failed to remove user:', error);
      toast.error('Failed to remove user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEnterRoom = () => {
    if (!schedule) return;
    router.push(`/rooms/${schedule.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading schedule details...</p>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Schedule not found</h2>
          <p className="mt-2 text-gray-600">The schedule you're looking for doesn't exist.</p>
          <Button 
            onClick={() => router.push(`/admin/schedule/${interviewType.toLowerCase()}`)}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {config.name} Schedules
          </Button>
        </div>
      </div>
    );
  }

  const bookingStatus = getBookingStatus(schedule);
  const now = new Date();
  const startTime = new Date(schedule.startTime);
  const endTime = new Date(schedule.endTime);
  const minutesToStart = differenceInMinutes(startTime, now);
  const minutesToEnd = differenceInMinutes(endTime, now);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/schedule/${interviewType.toLowerCase()}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {config.name} Schedules
          </Button>
        </div>
        <div className="flex gap-2">
          {bookingStatus.isOpen && (schedule.status === 'PENDING' || schedule.status === 'BOOKING_STARTED') && (
            <Button
              variant="outline"
              onClick={handleCloseBooking}
              disabled={actionLoading === 'close'}
              className="bg-red-50 hover:bg-red-100 text-red-700"
            >
              <Ban className="h-4 w-4 mr-2" />
              {actionLoading === 'close' ? 'Closing...' : 'Close Booking'}
            </Button>
          )}
          {!bookingStatus.isOpen && (schedule.status === 'PENDING' || schedule.status === 'BOOKING_STARTED') && (
            <Button
              variant="outline"
              onClick={handleReopenBooking}
              disabled={actionLoading === 'reopen'}
              className="bg-blue-50 hover:bg-blue-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {actionLoading === 'reopen' ? 'Reopening...' : 'Reopen Booking'}
            </Button>
          )}
          {(schedule.status === 'ACTIVE' || schedule.status === 'BOOKING_STARTED') && (
            <Button
              variant="outline"
              onClick={handleEndMeeting}
              disabled={actionLoading === 'end'}
              className="bg-orange-50 hover:bg-orange-100 text-orange-700"
            >
              <Ban className="h-4 w-4 mr-2" />
              {actionLoading === 'end' ? 'Ending...' : 'End Meeting'}
            </Button>
          )}
          <Button onClick={handleEnterRoom}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Enter Room
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <config.icon className="h-5 w-5" />
              {config.name} Schedule Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Title</label>
              <p className="text-lg font-semibold">{schedule.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-gray-700">{schedule.description || 'No description provided'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Start Time</label>
                <p className="font-semibold">{format(startTime, 'PPp')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">End Time</label>
                <p className="font-semibold">{format(endTime, 'PPp')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Duration</label>
                <p className="font-semibold">{schedule.duration} minutes</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Wait Time</label>
                <p className="font-semibold">{schedule.waitTime} minutes</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(schedule.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Booking Status</label>
                <div className="mt-1">
                  <Badge className={bookingStatus.color}>{bookingStatus.label}</Badge>
                </div>
              </div>
            </div>
            {schedule.meetingUrl && (
              <div>
                <label className="text-sm font-medium text-gray-500">Meeting URL</label>
                <p className="text-blue-600 break-all">{schedule.meetingUrl}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Participants ({schedule.userMeetings?.length || 0})</span>
              <Button
                size="sm"
                onClick={() => setIsAddUserOpen(true)}
                disabled={schedule.status === 'DONE' || schedule.status === 'OVER'}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {schedule.userMeetings && schedule.userMeetings.length > 0 ? (
              <div className="space-y-3">
                {schedule.userMeetings.map((userMeeting) => (
                  <div key={userMeeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{userMeeting.user.name}</p>
                      <p className="text-sm text-gray-500">{userMeeting.user.email}</p>
                      {userMeeting.experienceLevel && (
                        <Badge variant="outline" className="mt-1">
                          {userMeeting.experienceLevel}
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveUser(userMeeting.id)}
                      disabled={actionLoading === userMeeting.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No participants yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User to {config.name} Session</DialogTitle>
            <DialogDescription>
              Select a user to add to this {config.name.toLowerCase()} practice session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select User</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Choose a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Experience Level</label>
              <select
                value={selectedExperienceLevel}
                onChange={(e) => setSelectedExperienceLevel(e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')}
                className="w-full p-2 border rounded-md"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddUser}
                disabled={!selectedUserId || actionLoading === 'add-user'}
                className="flex-1"
              >
                {actionLoading === 'add-user' ? 'Adding...' : 'Add User'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddUserOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

