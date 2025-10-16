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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format, differenceInMinutes } from "date-fns";
import { Users, ArrowRight, RefreshCw, Ban } from "lucide-react";
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
    };
  }[];
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
  
  // If meeting has started or ended
  if (schedule.status === 'ACTIVE' || schedule.status === 'DONE' || schedule.status === 'OVER') {
    return { isOpen: false, label: 'Closed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
  }
  
  // Check if admin manually closed booking
  if (schedule.bookingOpen === false) {
    return { isOpen: false, label: 'Closed (Manual)', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
  }
  
  // If bookingOpen is true, respect admin's decision (override time restrictions)
  // Show status based on bookingOpen field only
  if (schedule.bookingOpen === true) {
    if (minutesToStart < 20) {
      // Admin has explicitly reopened this meeting
      return { isOpen: true, label: `Open (${minutesToStart}m)`, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    }
    return { isOpen: true, label: 'Open', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  }
  
  // Default: Closed
  return { isOpen: false, label: 'Closed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
};

export default function SchedulePage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    description: '',
  });

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/admin/schedule');
      const data = await response.json();
      // Ensure userMeetings is always an array even if it's not present
      const schedulesWithUserMeetings = data.map((schedule: Schedule) => ({
        ...schedule,
        userMeetings: schedule.userMeetings || []
      }));
      setSchedules(schedulesWithUserMeetings);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      setSchedules([]);
    }
  };

  useEffect(() => {
    fetchSchedules();
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

  const handleEnterRoom = (scheduleId: string) => {
    router.push(`/rooms/${scheduleId}`);
  };

  const handleReopenBooking = async (scheduleId: string) => {
    try {
      const res = await fetch(`/api/admin/schedule/${scheduleId}/reopen`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to reopen booking');

      toast.success('Booking reopened successfully');
      fetchSchedules();
    } catch (error) {
      console.error('Failed to reopen booking:', error);
      toast.error('Failed to reopen booking');
    }
  };

  const handleCloseBooking = async (scheduleId: string) => {
    try {
      const res = await fetch(`/api/admin/schedule/${scheduleId}/close`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to close booking');

      toast.success('Booking closed successfully');
      fetchSchedules();
    } catch (error) {
      console.error('Failed to close booking:', error);
      toast.error('Failed to close booking');
    }
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
            <TableHead>Booking Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map((schedule) => {
            const bookingStatus = getBookingStatus(schedule);
            return (
              <TableRow key={schedule.id}>
                <TableCell>{schedule.title}</TableCell>
                <TableCell>{format(new Date(schedule.startTime), 'PPp')}</TableCell>
                <TableCell>{format(new Date(schedule.endTime), 'PPp')}</TableCell>
                <TableCell>{schedule.duration}</TableCell>
                <TableCell>{schedule.userMeetings?.length || 0}</TableCell>
                <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                <TableCell>
                  <Badge className={bookingStatus.color}>{bookingStatus.label}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/schedule/${schedule.id}`)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                    {bookingStatus.isOpen && (schedule.status === 'PENDING' || schedule.status === 'BOOKING_STARTED') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCloseBooking(schedule.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-700"
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Close Booking
                      </Button>
                    )}
                    {!bookingStatus.isOpen && (schedule.status === 'PENDING' || schedule.status === 'BOOKING_STARTED') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReopenBooking(schedule.id)}
                        className="bg-blue-50 hover:bg-blue-100"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Reopen
                      </Button>
                    )}
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
