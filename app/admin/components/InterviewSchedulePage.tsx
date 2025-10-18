"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSchedules, useCloseBooking, useReopenBooking } from '@/lib/hooks/useSchedules';
import { ScheduleTableSkeleton } from './ScheduleTableSkeleton';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, differenceInMinutes } from "date-fns";
import { Users, ArrowRight, RefreshCw, Ban } from "lucide-react";
import { toast } from "sonner";
import { 
  InterviewType, 
  INTERVIEW_TYPE_CONFIG, 
  Schedule, 
  ScheduleFormData 
} from "@/lib/types/interview-types";
import { Code, Network, MessageSquare, Database, Brain, Monitor } from "lucide-react";

// Icon mapping
const iconMap = {
  'Code': Code,
  'Network': Network,
  'MessageSquare': MessageSquare,
  'Database': Database,
  'Brain': Brain,
  'Monitor': Monitor,
} as const;

interface InterviewSchedulePageProps {
  interviewType: InterviewType;
  title: string;
  description: string;
  iconName: string;
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
  if (schedule.bookingOpen === true) {
    if (minutesToStart < 20) {
      return { isOpen: true, label: `Open (${minutesToStart}m)`, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    }
    return { isOpen: true, label: 'Open', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  }
  
  // Default: Closed
  return { isOpen: false, label: 'Closed', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
};

export function InterviewSchedulePage({ 
  interviewType, 
  title, 
  description, 
  iconName 
}: InterviewSchedulePageProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: '',
    startTime: '',
    endTime: '',
    description: '',
    interviewType: interviewType,
  });

  // Use React Query hooks with pagination (now using manual pagination, not useInfiniteQuery)
  const { 
    data, 
    isLoading, 
    isError, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch 
  } = useSchedules(interviewType, statusFilter);
  const closeBooking = useCloseBooking();
  const reopenBooking = useReopenBooking();

  // Flatten paginated data - with extra safety checks
  const schedules = data?.pages?.flatMap(page => page?.items || []) ?? [];

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
        refetch();  // Use refetch instead of fetchSchedules
        setFormData({
          title: '',
          startTime: '',
          endTime: '',
          description: '',
          interviewType: interviewType,
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

  const handleReopenBooking = (scheduleId: string) => {
    reopenBooking.mutate(scheduleId);
  };

  const handleCloseBooking = (scheduleId: string) => {
    closeBooking.mutate(scheduleId);
  };

  const config = INTERVIEW_TYPE_CONFIG[interviewType];
  const Icon = iconMap[iconName as keyof typeof iconMap];

  if (isLoading) {
    return <ScheduleTableSkeleton />;
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Failed to load schedules</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Icon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="BOOKING_STARTED">Booking Started</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
              <SelectItem value="OVER">Over</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>Create New {config.name} Schedule</Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New {config.name} Schedule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={`${config.name} Practice Session`}
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
                  placeholder={config.description}
                />
              </div>
              <Button type="submit" className="w-full">Create {config.name} Schedule</Button>
            </form>
            </DialogContent>
          </Dialog>
        </div>
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
                      onClick={() => router.push(`/admin/schedule/${interviewType.toLowerCase().replace(/_/g, '-')}/${schedule.id}`)}
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

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
            size="lg"
          >
            {isFetchingNextPage ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              <>
                Load More Schedules
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Show count */}
      {schedules.length > 0 && (
        <div className="text-center text-sm text-gray-500 mt-4">
          Showing {schedules.length} schedules
          {isFetchingNextPage && <span className="ml-2">• Loading more...</span>}
        </div>
      )}
    </div>
  );
}
