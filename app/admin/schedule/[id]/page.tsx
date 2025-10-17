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
    experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
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
  const [selectedUserName, setSelectedUserName] = useState("");
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showExperienceLevelModal, setShowExperienceLevelModal] = useState(false);
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | ''>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddUser = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    if (!selectedExperienceLevel) {
      toast.error('Please select an experience level');
      return;
    }

    try {
      const response = await fetch(`/api/schedule/${scheduleId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedUserId,
          experienceLevel: selectedExperienceLevel 
        }),
      });

      if (response.ok) {
        fetchSchedule();
        setSelectedUserId("");
        setSelectedUserName("");
        setSelectedUserEmail("");
        setUserSearchQuery("");
        setSelectedExperienceLevel("");
        setShowDropdown(false);
        setShowExperienceLevelModal(false);
        toast.success('User added to meeting');
      } else {
        throw new Error('Failed to add user');
      }
    } catch (error) {
      console.error('Failed to add user:', error);
      toast.error('Failed to add user to meeting');
    }
  };

  // Filter users based on search query
  const filteredUsers = availableUsers
    .filter(user => !schedule?.userMeetings.some(um => um.user.id === user.id))
    .filter(user => {
      if (!userSearchQuery) return false; // Don't show anything if no search
      const query = userSearchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    });

  const handleSelectUser = (user: User) => {
    setSelectedUserId(user.id);
    setSelectedUserName(user.name);
    setSelectedUserEmail(user.email);
    setUserSearchQuery(user.name);
    setShowDropdown(false);
    setShowExperienceLevelModal(true); // Open experience level modal
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserSearchQuery(value);
    setShowDropdown(value.length > 0);
    if (value.length === 0) {
      setSelectedUserId("");
      setSelectedUserName("");
      setSelectedUserEmail("");
      setSelectedExperienceLevel("");
    }
  };

  const handleCancelExperienceLevel = () => {
    setShowExperienceLevelModal(false);
    setSelectedUserId("");
    setSelectedUserName("");
    setSelectedUserEmail("");
    setSelectedExperienceLevel("");
    setUserSearchQuery("");
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
    router.push(`/admin/users/${userId}`);
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

  const handleEndMeeting = async () => {
    try {
      const response = await fetch(`/api/admin/schedule/${scheduleId}/end`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchSchedule();
        toast.success('Meeting stopped successfully');
      } else {
        throw new Error('Failed to stop meeting');
      }
    } catch (error) {
      console.error('Failed to stop meeting:', error);
      toast.error('Failed to stop meeting');
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
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
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Meeting Management</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
            <div className="flex gap-2 flex-wrap pt-3 border-t">
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
              {(schedule.status === 'ACTIVE' || schedule.status === 'BOOKING_STARTED') && (
                <Button
                  onClick={handleEndMeeting}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  🛑 Stop Meeting
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add User Manually */}
        {!isMeetingEnded && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add User Manually</CardTitle>
              <p className="text-xs text-muted-foreground">Start typing to search for users by name or email</p>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="flex gap-2">
                {/* Searchable Dropdown */}
                <div className="flex-1 relative" ref={dropdownRef}>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Type to search users..."
                      value={userSearchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => setShowDropdown(userSearchQuery.length > 0)}
                      className="pr-10"
                      autoComplete="off"
                    />
                    {userSearchQuery && (
                      <button
                        onClick={() => {
                          setUserSearchQuery("");
                          setSelectedUserId("");
                          setSelectedUserName("");
                          setSelectedUserEmail("");
                          setSelectedExperienceLevel("");
                          setShowDropdown(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Dropdown Results */}
                  {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredUsers.length > 0 ? (
                        <ul className="py-1">
                          {filteredUsers.map((user) => (
                            <li
                              key={user.id}
                              onClick={() => handleSelectUser(user)}
                              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                            >
                              <div className="font-medium text-sm">{user.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                          No users found matching "{userSearchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleAddUser} 
                  disabled={!selectedUserId}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>

              {/* Selected user indicator */}
              {selectedUserId && selectedUserName && selectedExperienceLevel && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <span className="font-medium">Selected:</span> {selectedUserName}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Level: {selectedExperienceLevel}
                      </p>
                    </div>
                    <Badge className={
                      selectedExperienceLevel === 'BEGINNER' ? 'bg-green-500' :
                      selectedExperienceLevel === 'INTERMEDIATE' ? 'bg-blue-500' :
                      'bg-purple-500'
                    }>
                      {selectedExperienceLevel === 'BEGINNER' && '🎓'}
                      {selectedExperienceLevel === 'INTERMEDIATE' && '💻'}
                      {selectedExperienceLevel === 'ADVANCED' && '⚡'}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Experience Level Selection Modal */}
        <Dialog open={showExperienceLevelModal} onOpenChange={setShowExperienceLevelModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select Experience Level</DialogTitle>
              <DialogDescription>
                Choose the experience level for <span className="font-medium">{selectedUserName}</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 py-4">
              {/* Beginner */}
              <button
                onClick={() => setSelectedExperienceLevel('BEGINNER')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedExperienceLevel === 'BEGINNER'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center text-2xl">
                    🎓
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base">Beginner</div>
                    <div className="text-sm text-muted-foreground">0-2 years of experience</div>
                  </div>
                  {selectedExperienceLevel === 'BEGINNER' && (
                    <div className="text-green-600 dark:text-green-400">✓</div>
                  )}
                </div>
              </button>

              {/* Intermediate */}
              <button
                onClick={() => setSelectedExperienceLevel('INTERMEDIATE')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedExperienceLevel === 'INTERMEDIATE'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-2xl">
                    💻
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base">Intermediate</div>
                    <div className="text-sm text-muted-foreground">2-5 years of experience</div>
                  </div>
                  {selectedExperienceLevel === 'INTERMEDIATE' && (
                    <div className="text-blue-600 dark:text-blue-400">✓</div>
                  )}
                </div>
              </button>

              {/* Advanced */}
              <button
                onClick={() => setSelectedExperienceLevel('ADVANCED')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedExperienceLevel === 'ADVANCED'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-2xl">
                    ⚡
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base">Advanced</div>
                    <div className="text-sm text-muted-foreground">5+ years of experience</div>
                  </div>
                  {selectedExperienceLevel === 'ADVANCED' && (
                    <div className="text-purple-600 dark:text-purple-400">✓</div>
                  )}
                </div>
              </button>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCancelExperienceLevel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={!selectedExperienceLevel}
                className="flex-1"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Current Participants - Grouped by Experience Level */}
        <div className="space-y-3">
          {/* No Participants Message */}
          {schedule.userMeetings.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">No participants yet</div>
              </CardContent>
            </Card>
          )}

          {/* Beginner Participants */}
          {schedule.userMeetings.filter(um => um.experienceLevel === 'BEGINNER').length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <span className="text-xl">🎓</span>
                  </div>
                  <div>
                    <CardTitle className="text-base">Beginner Participants</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {schedule.userMeetings.filter(um => um.experienceLevel === 'BEGINNER').length} participant(s)
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto pt-2">
                <div className="space-y-2">
                  {schedule.userMeetings
                    .filter(um => um.experienceLevel === 'BEGINNER')
                    .map((um) => (
                      <div
                        key={um.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm">{um.user.name}</div>
                            <Badge className="bg-green-500 text-white text-xs">Beginner</Badge>
                          </div>
                          <div className="text-xs text-gray-500 truncate">{um.user.email}</div>
                          <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                            {um.user.phoneNumber && (
                              <span>📞 {um.user.phoneNumber}</span>
                            )}
                            {um.user.country && (
                              <span>🌍 {um.user.country}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
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
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Intermediate Participants */}
          {schedule.userMeetings.filter(um => um.experienceLevel === 'INTERMEDIATE').length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-xl">💻</span>
                  </div>
                  <div>
                    <CardTitle className="text-base">Intermediate Participants</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {schedule.userMeetings.filter(um => um.experienceLevel === 'INTERMEDIATE').length} participant(s)
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto pt-2">
                <div className="space-y-2">
                  {schedule.userMeetings
                    .filter(um => um.experienceLevel === 'INTERMEDIATE')
                    .map((um) => (
                      <div
                        key={um.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm">{um.user.name}</div>
                            <Badge className="bg-blue-500 text-white text-xs">Intermediate</Badge>
                          </div>
                          <div className="text-xs text-gray-500 truncate">{um.user.email}</div>
                          <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                            {um.user.phoneNumber && (
                              <span>📞 {um.user.phoneNumber}</span>
                            )}
                            {um.user.country && (
                              <span>🌍 {um.user.country}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
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
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Advanced Participants */}
          {schedule.userMeetings.filter(um => um.experienceLevel === 'ADVANCED').length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <span className="text-xl">⚡</span>
                  </div>
                  <div>
                    <CardTitle className="text-base">Advanced Participants</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {schedule.userMeetings.filter(um => um.experienceLevel === 'ADVANCED').length} participant(s)
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto pt-2">
                <div className="space-y-2">
                  {schedule.userMeetings
                    .filter(um => um.experienceLevel === 'ADVANCED')
                    .map((um) => (
                      <div
                        key={um.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm">{um.user.name}</div>
                            <Badge className="bg-purple-500 text-white text-xs">Advanced</Badge>
                          </div>
                          <div className="text-xs text-gray-500 truncate">{um.user.email}</div>
                          <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                            {um.user.phoneNumber && (
                              <span>📞 {um.user.phoneNumber}</span>
                            )}
                            {um.user.country && (
                              <span>🌍 {um.user.country}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
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
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Participants without Experience Level */}
          {schedule.userMeetings.filter(um => !um.experienceLevel).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <span className="text-xl">❓</span>
                  </div>
                  <div>
                    <CardTitle className="text-base">Not Specified</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {schedule.userMeetings.filter(um => !um.experienceLevel).length} participant(s)
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto pt-2">
                <div className="space-y-2">
                  {schedule.userMeetings
                    .filter(um => !um.experienceLevel)
                    .map((um) => (
                      <div
                        key={um.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm">{um.user.name}</div>
                            <Badge variant="outline" className="text-xs">Not Specified</Badge>
                          </div>
                          <div className="text-xs text-gray-500 truncate">{um.user.email}</div>
                          <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                            {um.user.phoneNumber && (
                              <span>📞 {um.user.phoneNumber}</span>
                            )}
                            {um.user.country && (
                              <span>🌍 {um.user.country}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
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
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

