import { useState, useEffect, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, Video, Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { MeetingConfirmationDialog } from "./MeetingConfirmationDialog";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

interface User {
  name: string;
  image: string | null;
}

interface UserMeeting {
  id: string;
  user: User;
}

interface InterviewSchedule {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  waitTime: number;
  meetingUrl: string | null;
  status: 'PENDING' | 'BOOKED' | 'COMPLETED' | 'CANCELLED';
  counting: number;
  UserMeeting: UserMeeting[];
}

interface InterviewCardProps {
  schedule: InterviewSchedule;
  onJoin: (schedule: InterviewSchedule) => void;
  onViewParticipants: (schedule: InterviewSchedule) => void;
}

interface MeetingStatus {
  status: 'not_joined' | 'joined_waiting' | 'in_waiting_room' | 'in_meeting' | 'ended';
  primaryButton: {
    text: string;
    enabled: boolean;
    action: 'join' | 'view' | 'enter_room' | 'join_meeting' | 'none';
  };
  secondaryButton?: {
    text: string;
    enabled: boolean;
    action: 'add_calendar' | 'view_participants' | 'none';
  };
  statusText: string;
  statusColor: string;
}

export function InterviewCard({ schedule, onJoin, onViewParticipants }: InterviewCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [showParticipantsDialog, setShowParticipantsDialog] = useState(false);
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  
  const meetingState = useMemo(() => {
    const now = new Date();
    const start = new Date(schedule.startTime);
    const end = new Date(schedule.endTime);
    const waitEnd = new Date(start.getTime() + schedule.waitTime * 60000);
    
    // Add null checks and logging
    const currentUserName = session?.user?.name;
    const participants = schedule.UserMeeting?.map(p => p.user?.name).filter(Boolean) || [];
    
    console.log('Meeting State Debug:', {
      currentUserName,
      participants,
      scheduleId: schedule.id
    });

    const isUserJoined = Boolean(
      currentUserName && 
      Array.isArray(schedule.UserMeeting) && 
      schedule.UserMeeting.some(
        participant => participant.user?.name === currentUserName
      )
    );

    return {
      now,
      start,
      end,
      waitEnd,
      isUserJoined
    };
  }, [schedule, session]);

  const meetingStatus = useMemo(() => {
    const { now, start, end, waitEnd, isUserJoined } = meetingState;
    
    // If meeting has ended
    if (now > end) {
      return {
        status: 'ended',
        primaryButton: {
          text: 'Meeting Ended',
          enabled: false,
          action: 'none'
        },
        statusText: 'Meeting has ended',
        statusColor: 'text-gray-600'
      };
    }

    // If meeting is in progress (after wait time)
    if (now >= waitEnd) {
      return isUserJoined ? {
        status: 'in_meeting',
        primaryButton: {
          text: 'Join Interview',
          enabled: true,
          action: 'enter_room'
        },
        statusText: 'Interview is live!',
        statusColor: 'text-green-600'
      } : {
        status: 'not_joined',
        primaryButton: {
          text: 'Meeting in Progress',
          enabled: false,
          action: 'none'
        },
        statusText: 'Meeting has started',
        statusColor: 'text-red-600'
      };
    }

    // If in waiting room period (between start time and wait time)
    if (now >= start) {
      return isUserJoined ? {
        status: 'in_waiting_room',
        primaryButton: {
          text: 'Join Meeting Room',
          enabled: true,
          action: 'enter_room'
        },
        secondaryButton: {
          text: 'View Participants',
          enabled: true,
          action: 'view_participants'
        },
        statusText: 'Waiting room is open',
        statusColor: 'text-blue-600'
      } : {
        status: 'not_joined',
        primaryButton: {
          text: 'Meeting Starting Soon',
          enabled: false,
          action: 'none'
        },
        statusText: 'Cannot join - meeting is starting',
        statusColor: 'text-red-600'
      };
    }

    // Before meeting start time
    return isUserJoined ? {
      status: 'joined_waiting',
      primaryButton: {
        text: 'View Meeting',
        enabled: true,
        action: 'view'
      },
      secondaryButton: {
        text: 'Add to Calendar',
        enabled: true,
        action: 'add_calendar'
      },
      statusText: `Starting ${formatDistanceToNow(start, { addSuffix: true })}`,
      statusColor: 'text-green-600'
    } : {
      status: 'not_joined',
      primaryButton: {
        text: 'Join Meeting',
        enabled: true,
        action: 'join'
      },
      statusText: `Starts ${formatDistanceToNow(start, { addSuffix: true })}`,
      statusColor: 'text-gray-600'
    };
  }, [meetingState]);

  const handlePrimaryAction = () => {
    switch (meetingStatus.primaryButton.action) {
      case 'join':
        onJoin(schedule);
        break;
      case 'view':
        setShowConfirmationDialog(true);
        break;
      case 'enter_room':
      case 'join_meeting':
        // Navigate to the room page instead of opening the dialog
        router.push(`/rooms/${schedule.id}`);
        break;
    }
  };

  const handleSecondaryAction = () => {
    switch (meetingStatus.secondaryButton?.action) {
      case 'add_calendar':
        addToCalendar();
        break;
      case 'view_participants':
        setShowParticipantsDialog(true);
        break;
    }
  };

  const addToCalendar = () => {
    const event = {
      text: "Mock Interview Session",
      dates: `${meetingState.start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${
        meetingState.end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      details: "What's next?\n\nYou can join the session 10 minutes prior to the start time.\n\nMake sure your audio and video devices are working ahead of time.",
      location: "Virtual Meeting"
    };

    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${event.dates}&text=${
        encodeURIComponent(event.text)}&details=${
        encodeURIComponent(event.details)}&location=${
        encodeURIComponent(event.location)}`,
      '_blank'
    );
  };

  return (
    <>
      <Card className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        meetingState.isUserJoined && "border-green-500 border-2",
        meetingStatus.status === 'in_meeting' && meetingState.isUserJoined && "bg-green-50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">
                  {format(meetingState.start, 'EEEE, MMMM d')}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {format(meetingState.start, 'h:mm a')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Video className="h-4 w-4" />
                    Virtual Meeting
                  </div>
                </div>
                <p className={`text-sm mt-1 ${meetingStatus.statusColor}`}>
                  {meetingStatus.statusText}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {schedule.duration} mins
              </div>
              <div className="flex gap-2">
                {meetingStatus.secondaryButton && (
                  <Button 
                    onClick={handleSecondaryAction}
                    disabled={!meetingStatus.secondaryButton.enabled}
                    variant="outline"
                  >
                    {meetingStatus.secondaryButton.text}
                  </Button>
                )}
                <Button 
                  onClick={handlePrimaryAction}
                  disabled={!meetingStatus.primaryButton.enabled}
                  variant={meetingState.isUserJoined ? "default" : "outline"}
                  className={cn(
                    meetingState.isUserJoined && "bg-green-600 hover:bg-green-700",
                    meetingStatus.status === 'in_meeting' && meetingState.isUserJoined && "animate-pulse"
                  )}
                >
                  {meetingStatus.primaryButton.text}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-medium">
              Participants ({schedule.UserMeeting.length})
            </h4>
            <div className="flex gap-2 mt-2">
              {schedule.UserMeeting.map((participant) => (
                <Avatar key={participant.id}>
                  <AvatarImage src={participant.user.image || ''} />
                  <AvatarFallback>{participant.user.name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <MeetingConfirmationDialog
        isOpen={showConfirmationDialog}
        onClose={() => setShowConfirmationDialog(false)}
        schedule={schedule}
        onAddToCalendar={addToCalendar}
      />
    </>
  );
}