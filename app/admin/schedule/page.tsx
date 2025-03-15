"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Users, UserPlus, UserMinus, ArrowRight } from "lucide-react";
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
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  UserMeeting: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function SchedulePage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    description: '',
  });

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/schedule');
      const data = await response.json();
      // Ensure UserMeeting is always an array even if it's not present
      const schedulesWithUserMeeting = data.map((schedule: Schedule) => ({
        ...schedule,
        UserMeeting: schedule.UserMeeting || []
      }));
      setSchedules(schedulesWithUserMeeting);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      setSchedules([]);
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
    fetchSchedules();
    fetchAvailableUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsOpen(false);
        fetchSchedules();
        setFormData({
          title: '',
          startTime: '',
          endTime: '',
          description: '',
        });
        toast.success('Schedule created successfully');
      }
    } catch (error) {
      console.error('Failed to create schedule:', error);
      toast.error('Failed to create schedule');
    }
  };

  const handleAddUser = async (scheduleId: string, userId: string) => {
    try {
      const response = await fetch(`/api/schedule/${scheduleId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        fetchSchedules();
        toast.success('User added to meeting');
      } else {
        throw new Error('Failed to add user');
      }
    } catch (error) {
      console.error('Failed to add user:', error);
      toast.error('Failed to add user to meeting');
    }
  };

  const handleRemoveUser = async (scheduleId: string, userId: string) => {
    try {
      const response = await fetch(`/api/schedule/${scheduleId}/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSchedules();
        toast.success('User removed from meeting');
      } else {
        throw new Error('Failed to remove user');
      }
    } catch (error) {
      console.error('Failed to remove user:', error);
      toast.error('Failed to remove user from meeting');
    }
  };

  const handleViewParticipants = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowParticipants(true);
  };

  const handleEnterRoom = (scheduleId: string) => {
    router.push(`/rooms/${scheduleId}`);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Interview Schedule Management</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Create New Schedule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Schedule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Start Time</label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Time</label>
                <Input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">Create Schedule</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Duration (mins)</TableHead>
            <TableHead>Participants</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map((schedule) => (
            <TableRow key={schedule.id}>
              <TableCell>{schedule.title}</TableCell>
              <TableCell>{format(new Date(schedule.startTime), 'PPp')}</TableCell>
              <TableCell>{format(new Date(schedule.endTime), 'PPp')}</TableCell>
              <TableCell>{schedule.duration}</TableCell>
              <TableCell>{schedule.UserMeeting?.length || 0}</TableCell>
              <TableCell>{schedule.status}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewParticipants(schedule)}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleEnterRoom(schedule.id)}
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Enter Room
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Participants Management Dialog */}
      <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Participants</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Current Participants</h3>
              <div className="space-y-2">
                {selectedSchedule?.UserMeeting.map((um) => (
                  <div key={um.id} className="flex items-center justify-between">
                    <span>{um.user.name} ({um.user.email})</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveUser(selectedSchedule.id, um.user.id)}
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Available Users</h3>
              <div className="space-y-2">
                {availableUsers
                  .filter(user => !selectedSchedule?.UserMeeting
                    .some(um => um.user.id === user.id))
                  .map(user => (
                    <div key={user.id} className="flex items-center justify-between">
                      <span>{user.name} ({user.email})</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => selectedSchedule && handleAddUser(selectedSchedule.id, user.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
