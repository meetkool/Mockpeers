"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format, differenceInMinutes } from "date-fns";
import { ArrowLeft, ArrowRight, RefreshCw, Ban, UserPlus, UserMinus, Code, Network, MessageSquare, Database, Brain, Monitor } from "lucide-react";
import { toast } from "sonner";
import { 
  InterviewType, 
  INTERVIEW_TYPE_CONFIG, 
  Schedule 
} from "@/lib/types/interview-types";

// Icon mapping
const iconMap = {
  'Code': Code,
  'Network': Network,
  'MessageSquare': MessageSquare,
  'Database': Database,
  'Brain': Brain,
  'Monitor': Monitor,
} as const;

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
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const config = INTERVIEW_TYPE_CONFIG[interviewType];
  const Icon = iconMap[config.icon as keyof typeof iconMap];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`/api/admin/schedule/${scheduleId}`);
      if (response.ok) {
        const data: Schedule = await response.json();
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

      // Refresh schedule data to show updated status immediately
      await fetchSchedule();
      
      toast.success('Booking reopened successfully');
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

      // Refresh schedule data to show updated status immediately
      await fetchSchedule();
      
      toast.success('Booking closed successfully');
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

      // Refresh schedule data to show updated status immediately
      await fetchSchedule();
      
      toast.success('Meeting ended successfully');
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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add user');
      }

      // Refresh schedule data to show new participant immediately
      await fetchSchedule();
      
      toast.success('User added successfully');
      setIsAddUserOpen(false);
      setSelectedUserId('');
      setUserSearchQuery('');
      setIsUserDropdownOpen(false);
    } catch (error: any) {
      console.error('Failed to add user:', error);
      toast.error(error.message || 'Failed to add user');
    } finally {
      setActionLoading(null);
    }
  };

  // Get IDs of users already added to this schedule
  const addedUserIds = new Set(
    schedule?.userMeetings?.map((um) => um.user.id) || []
  );

  // Filter users based on search query and exclude already added users
  const filteredUsers = users.filter((user) => {
    // Exclude users who are already added
    if (addedUserIds.has(user.id)) {
      return false;
    }
    
    const query = userSearchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  // Check if search matches an already-added user
  const searchMatchesAddedUser = userSearchQuery.length >= 2 && users.some((user) => {
    const query = userSearchQuery.toLowerCase();
    return (
      addedUserIds.has(user.id) && 
      (user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query))
    );
  });

  // Get selected user details for display
  const selectedUser = users.find(u => u.id === selectedUserId);

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find(u => u.id === userId);
    if (user) {
      setUserSearchQuery(user.name);
    }
    setIsUserDropdownOpen(false);
  };

  const handleRemoveUser = async (userMeetingId: string) => {
    if (!schedule) return;
    setActionLoading(userMeetingId);
    try {
      const res = await fetch(`/api/admin/schedule/${schedule.id}/users/${userMeetingId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove user');

      // Refresh schedule data to update participant list immediately
      await fetchSchedule();
      
      toast.success('User removed successfully');
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

      {/* Schedule Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {config.name} Schedule Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Title</label>
              <p className="text-lg font-semibold">{schedule.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-gray-700">{schedule.description || 'No description provided'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Start Time</label>
              <p className="font-semibold text-sm">{format(startTime, 'PPp')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">End Time</label>
              <p className="font-semibold text-sm">{format(endTime, 'PPp')}</p>
            </div>
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

      {/* Participants Table - Full Width */}
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Experience</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Contact</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">LeetCode</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Joined At</th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {schedule.userMeetings.map((userMeeting) => (
                    <tr key={userMeeting.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {userMeeting.user.name || 'N/A'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {userMeeting.user.email}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        {userMeeting.experienceLevel ? (
                          <Badge 
                            variant="outline" 
                            className={
                              userMeeting.experienceLevel === 'BEGINNER' 
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400'
                                : userMeeting.experienceLevel === 'INTERMEDIATE'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400'
                            }
                          >
                            {userMeeting.experienceLevel}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 text-sm">
                          {userMeeting.user.phoneNumber && (
                            <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                              <span>📞</span>
                              <span className="font-mono text-xs">{userMeeting.user.phoneNumber}</span>
                            </div>
                          )}
                          {userMeeting.user.country && (
                            <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                              <span>🌍</span>
                              <span className="font-semibold text-xs">{userMeeting.user.country}</span>
                            </div>
                          )}
                          {!userMeeting.user.phoneNumber && !userMeeting.user.country && (
                            <span className="text-xs text-gray-400">No contact info</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {userMeeting.user.leetcodeUsername ? (
                          <a
                            href={`https://leetcode.com/${userMeeting.user.leetcodeUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {userMeeting.user.leetcodeUsername}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">Not provided</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant="outline"
                          className={
                            userMeeting.status === 'JOINED'
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400'
                          }
                        >
                          {userMeeting.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          <div>{format(new Date(userMeeting.joinedAt), 'MMM dd, yyyy')}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(userMeeting.joinedAt), 'hh:mm a')}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveUser(userMeeting.id)}
                          disabled={actionLoading === userMeeting.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No participants yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Click "Add User" to add participants to this session
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddUserOpen} onOpenChange={(open) => {
        setIsAddUserOpen(open);
        if (!open) {
          setUserSearchQuery('');
          setSelectedUserId('');
          setIsUserDropdownOpen(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add User to {config.name} Session</DialogTitle>
            <DialogDescription>
              Select a user to add to this {config.name.toLowerCase()} practice session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select User</label>
              <div className="mt-1 relative" ref={dropdownRef}>
                <Input
                  type="text"
                  placeholder="Type at least 2 characters to search users..."
                  value={userSearchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setUserSearchQuery(value);
                    // Only open dropdown if user has typed at least 2 characters
                    if (value.length >= 2) {
                      setIsUserDropdownOpen(true);
                    } else {
                      setIsUserDropdownOpen(false);
                      if (value.length === 0) {
                        setSelectedUserId('');
                      }
                    }
                  }}
                  className="w-full"
                  autoComplete="off"
                />
                
                {/* Helper text */}
                {userSearchQuery.length > 0 && userSearchQuery.length < 2 && (
                  <p className="text-xs text-gray-500 mt-1">Type one more character to search...</p>
                )}
                
                {/* Dropdown List - Only show when user has typed at least 2 characters */}
                {isUserDropdownOpen && userSearchQuery.length >= 2 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredUsers.length > 0 ? (
                      <div className="py-1">
                        <div className="px-3 py-1 text-xs text-gray-500 border-b dark:border-gray-700">
                          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                        </div>
                        {filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => handleSelectUser(user.id)}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                              selectedUserId === user.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">
                        {searchMatchesAddedUser ? (
                          <>
                            <p className="font-medium">User already added to this session</p>
                            <p className="text-xs mt-1">This user is already a participant</p>
                          </>
                        ) : (
                          <>No users found matching "{userSearchQuery}"</>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Selected User Display */}
                {selectedUser && !isUserDropdownOpen && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{selectedUser.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{selectedUser.email}</div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUserId('');
                          setUserSearchQuery('');
                        }}
                        className="h-6 w-6 p-0"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                )}
              </div>
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

