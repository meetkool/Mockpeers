"use client";

import { useState, useEffect } from "react";
import { InterviewCard } from "@/app/components/interviews/InterviewCard";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';

interface Schedule {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  waitTime: number;
  meetingUrl: string | null;
  status: 'PENDING' | 'BOOKED' | 'COMPLETED' | 'CANCELLED';
  counting: number;
  UserMeeting: {
    id: string;
    user: {
      name: string;
      image: string | null;
    };
  }[];
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Schedule | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const router = useRouter();

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/schedule/available');
      const result = await response.json();
      console.log('API Response:', result); // Debug log
      setSchedules(result.data || []); // Access the data property from the response
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      setSchedules([]);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleJoin = async (schedule: Schedule) => {
    try {
      const response = await fetch('/api/schedule/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId: schedule.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Already joined this schedule") {
          toast.info("You have already joined this meeting");
        } else {
          toast.error(data.error || 'Failed to join meeting');
        }
        return;
      }

      // Immediately fetch updated schedules to reflect the new state
      await fetchSchedules();
      
      setSelectedMeeting(schedule);
      setShowConfirmation(true);
      toast.success('Successfully joined the meeting');
      
    } catch (error) {
      console.error('Failed to join meeting:', error);
      toast.error('Unable to join meeting at this time');
    }
  };

  const handleViewParticipants = (schedule: Schedule) => {
    setSelectedMeeting(schedule);
    setShowParticipants(true);
  };

  const addToCalendar = () => {
    if (!selectedMeeting) return;

    const startTime = new Date(selectedMeeting.startTime);
    const endTime = new Date(selectedMeeting.endTime);

    const event = {
      text: "Mock Interview Session",
      dates: `${startTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${
        endTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      details: "What's next?\n\nYou can join the session 10 minutes prior to the start time.\n\nMake sure your audio and video devices are working ahead of time.",
      location: "Virtual Meeting"
    };

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${event.dates}&text=${encodeURIComponent(event.text)}&details=${encodeURIComponent(event.details)}&location=${encodeURIComponent(event.location)}`;
    window.open(calendarUrl, '_blank');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Available Interview Slots</h1>

      <div className="space-y-4">
        {Array.isArray(schedules) && schedules.length > 0 ? (
          schedules.map((schedule) => (
            <InterviewCard
              key={schedule.id}
              schedule={schedule}
              onJoin={handleJoin}
              onViewParticipants={handleViewParticipants}
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No interview slots available at the moment.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interview Scheduled Successfully!</DialogTitle>
            <DialogDescription>
              Your interview has been scheduled for{' '}
              {selectedMeeting && (
                <span className="font-medium">
                  {format(new Date(selectedMeeting.startTime), 'EEEE, MMMM d, h:mm a')}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <h3 className="font-medium mb-2">Important Notes:</h3>
            <ul className="space-y-2 text-sm">
              <li>• Join 10 minutes before the scheduled time</li>
              <li>• Test your audio and video beforehand</li>
              <li>• Have a stable internet connection</li>
              <li>• Find a quiet, well-lit space</li>
            </ul>
          </div>

          <DialogFooter className="flex gap-2">
            <Button onClick={addToCalendar}>
              <Calendar className="mr-2 h-4 w-4" />
              Add to Calendar
            </Button>
            <Button onClick={() => {
              setShowConfirmation(false);
              router.push('/dashboard');
            }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Participants Dialog */}
      <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interview Participants</DialogTitle>
            <DialogDescription>
              {selectedMeeting && (
                <span>
                  Scheduled for {format(new Date(selectedMeeting.startTime), 'EEEE, MMMM d, h:mm a')}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedMeeting?.UserMeeting.map((participant) => (
              <div key={participant.user.name} className="flex items-center gap-3 mb-3">
                <Avatar>
                  <AvatarImage src={participant.user.image || ''} />
                  <AvatarFallback>{participant.user.name[0]}</AvatarFallback>
                </Avatar>
                <span>{participant.user.name}</span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowParticipants(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
