"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, differenceInMinutes } from "date-fns";
import { ArrowLeft, ArrowRight, RefreshCw, Ban, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";

interface Schedule {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  waitTime: number;
  counting: number;
  description: string;
  meetingUrl: string | null;
  status: 'PENDING' | 'BOOKING_STARTED' | 'ACTIVE' | 'DONE' | 'OVER' | 'CANCELLED';
  bookingOpen: boolean;
  userMeetings: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      phoneNumber?: string;
      country?: string;
    };
  }[];
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

export default function ManageSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const scheduleId = params.id as string;
  
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`/api/admin/schedule/${scheduleId}`);
      if (!response.ok) throw new Error('Failed to fetch schedule');
      const data = await response.json();
      setSchedule(data);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setAvailableUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setAvailableUsers([]);
    }
  };

  useEffect(() => {
    fetchSchedule();
    fetchAvailableUsers();
  }, [scheduleId]);

  const handleAddUser = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    try {
      const response = await fetch(`/api/schedule/${scheduleId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      if (response.ok) {
        fetchSchedule();
        setSelectedUserId("");
        toast.success('User added to meeting');
      } else {
        throw new Error('Failed to add user');
      }
    } catch (error) {
      console.error('Failed to add user:', error);
      toast.error('Failed to add user to meeting');
    }
  };

  const handleReopenBooking = async () => {
    try {
      const res = await fetch(`/api/admin/schedule/${scheduleId}/reopen`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to reopen booking');

      toast.success('Booking reopened successfully');
      fetchSchedule();
    } catch (error) {
      console.error('Failed to reopen booking:', error);
      toast.error('Failed to reopen booking');
    }
  };

  const handleCloseBooking = async () => {
    try {
      const res = await fetch(`/api/admin/schedule/${scheduleId}/close`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to close booking');

      toast.success('Booking closed successfully');
      fetchSchedule();
    } catch (error) {
      console.error('Failed to close booking:', error);
      toast.error('Failed to close booking');
    }
  };

  const handleEnterRoom = () => {
    router.push(`/rooms/${scheduleId}`);
  };

  const handleViewProfile = (userId: string) => {
    // You can implement profile view logic here
    toast.info(`View profile for user ${userId}`);
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/schedule/${scheduleId}/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSchedule();
        toast.success('User removed from meeting');
      } else {
        throw new Error('Failed to remove user');
      }
    } catch (error) {
      console.error('Failed to remove user:', error);
      toast.error('Failed to remove user from meeting');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Schedule not found</div>
      </div>
    );
  }

  const bookingStatus = getBookingStatus(schedule);
  const isMeetingEnded = schedule.status === 'DONE' || schedule.status === 'OVER' || schedule.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/schedule')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Schedule
          </Button>
        </div>

        {/* Meeting Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Meeting Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Title</div>
                <div className="font-medium">{schedule.title}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Start Time</div>
                <div className="font-medium">{format(new Date(schedule.startTime), 'PPp')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">End Time</div>
                <div className="font-medium">{format(new Date(schedule.endTime), 'PPp')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Duration (mins)</div>
                <div className="font-medium">{schedule.duration}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Participants</div>
                <div className="font-medium">{schedule.userMeetings?.length || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</div>
                <div>{getStatusBadge(schedule.status)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Booking Status</div>
                <div><Badge className={bookingStatus.color}>{bookingStatus.label}</Badge></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap pt-4 border-t">
              {bookingStatus.isOpen && (schedule.status === 'PENDING' || schedule.status === 'BOOKING_STARTED') && (
                <Button
                  variant="outline"
                  onClick={handleCloseBooking}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Close Booking
                </Button>
              )}
              {!bookingStatus.isOpen && (schedule.status === 'PENDING' || schedule.status === 'BOOKING_STARTED') && (
                <Button
                  variant="outline"
                  onClick={handleReopenBooking}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reopen
                </Button>
              )}
              <Button
                onClick={handleEnterRoom}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Enter Room
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add User Manually */}
        {!isMeetingEnded && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add User Manually</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex-1 h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="">Select a user...</option>
                  {availableUsers
                    .filter(user => !schedule.userMeetings.some(um => um.user.id === user.id))
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                </select>
                <Button onClick={handleAddUser} disabled={!selectedUserId}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedule.userMeetings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No participants yet</div>
              ) : (
                schedule.userMeetings.map((um) => (
                  <div
                    key={um.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{um.user.name}</div>
                      <div className="text-sm text-gray-500">{um.user.email}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProfile(um.user.id)}
                      >
                        See the profile
                      </Button>
                      {!isMeetingEnded && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveUser(um.user.id)}
                        >
                          <UserMinus className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

