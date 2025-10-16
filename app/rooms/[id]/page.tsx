"use client";

import { format } from "date-fns";
import { Calendar, Clock, Users, Video, Settings, MessageSquare, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface Message {
  user: string;
  text: string;
}

interface User {
  name: string;
  email: string;
  image: string | null;
}

interface UserMeeting {
  id: string;
  userId: string;
  scheduleId: string;
  role: string;
  status: string;
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
  userMeetings: UserMeeting[];
}

export default function RoomPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const params = useParams();
  const [schedule, setSchedule] = useState<InterviewSchedule | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");

  const updateCountdown = useCallback(() => {
    if (!schedule?.startTime) return;

    const now = new Date();
    const start = new Date(schedule.startTime);
    const waitEnd = new Date(start.getTime() + (schedule.waitTime * 60000)); // waitTime in minutes
    const end = new Date(schedule.endTime);

    // Calculate time differences
    const diffToStart = start.getTime() - now.getTime();
    const diffToWaitEnd = waitEnd.getTime() - now.getTime();
    const diffToEnd = end.getTime() - now.getTime();

    const formatTime = (ms: number) => {
      if (ms <= 0) return '0m 0s';
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    };

    // Meeting has ended
    if (now > end) {
      setCountdown("Meeting has ended");
      return;
    }

    // In active meeting (after waiting room)
    if (now >= waitEnd && now < end) {
      setCountdown(`Meeting ends in ${formatTime(diffToEnd)}`);
      return;
    }

    // In waiting room
    if (now >= start && now < waitEnd) {
      setCountdown(`Waiting room ends in ${formatTime(diffToWaitEnd)}`);
      if (schedule.meetingUrl) {
        window.open(schedule.meetingUrl, '_blank');
      }
      return;
    }

    // Before meeting starts
    if (now < start) {
      setCountdown(`Meeting starts in ${formatTime(diffToStart)}`);
      return;
    }
  }, [schedule?.startTime, schedule?.endTime, schedule?.waitTime, schedule?.meetingUrl]);

  const fetchMeetingDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/meetings/${params.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch meeting details');
      }
      
      setSchedule(data);
    } catch (error) {
      console.error('Error fetching meeting details:', error);
      toast.error('Failed to fetch meeting details');
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchMeetingDetails();
  }, [fetchMeetingDetails]);

  useEffect(() => {
    if (!schedule) return;

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [schedule, updateCountdown]);

  const addToCalendar = () => {
    if (!schedule) return;

    const event = {
      text: "Mock Interview Session",
      dates: `${new Date(schedule.startTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${
        new Date(schedule.endTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
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

  const handleAdminJoin = async () => {
    if (!schedule) return;
    
    try {
      const response = await fetch('/api/schedule/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scheduleId: schedule.id,
          isAdmin: true 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to join as admin');
      }

      toast.success('Successfully joined as admin');
      // Refresh meeting details
      fetchMeetingDetails();
    } catch (error) {
      toast.error('Failed to join as admin');
      console.error('Error joining as admin:', error);
    }
  };

  const handleAdminStartMeeting = async () => {
    if (!schedule) return;

    try {
      const response = await fetch(`/api/meetings/${schedule.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to start meeting');
      }

      toast.success('Meeting started successfully');
      // Refresh meeting details
      fetchMeetingDetails();
    } catch (error) {
      toast.error('Failed to start meeting');
      console.error('Error starting meeting:', error);
    }
  };

  const handleAdminEndMeeting = async () => {
    if (!schedule) return;

    try {
      const response = await fetch(`/api/meetings/${schedule.id}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to end meeting');
      }

      toast.success('Meeting ended successfully');
      // Refresh meeting details
      fetchMeetingDetails();
    } catch (error) {
      toast.error('Failed to end meeting');
      console.error('Error ending meeting:', error);
    }
  };

  const renderAdminControls = () => {
    if (!isAdmin) return null;

    const isAdminJoined = schedule?.userMeetings.some(
      um => um.user.email === session?.user?.email
    );

    return (
      <div className="bg-yellow-50 p-4 rounded-lg space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-yellow-600" />
          <h3 className="font-semibold text-yellow-800">Admin Controls</h3>
        </div>
        <div className="flex gap-2">
          {!isAdminJoined && (
            <Button 
              onClick={handleAdminJoin}
              variant={"outline" as const}
              className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
            >
              Join as Admin
            </Button>
          )}
          <Button 
            onClick={handleAdminStartMeeting}
            variant="outline"
            className="border-green-600 text-green-700 hover:bg-green-100"
          >
            Start Meeting
          </Button>
          <Button 
            onClick={handleAdminEndMeeting}
            variant="outline"
            className="border-red-600 text-red-700 hover:bg-red-100"
          >
            End Meeting
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!schedule) return <div className="flex items-center justify-center min-h-screen">Meeting not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {renderAdminControls()}
      <div className="grid grid-cols-12 gap-4 h-[80vh]">
        {/* Left Column - Meeting Info */}
        <div className="col-span-3 space-y-6">
          {/* Countdown Timer */}
          <div className="bg-primary/10 p-4 rounded-lg text-center">
            <h3 className="text-xl font-semibold">{countdown}</h3>
          </div>

          {/* Meeting Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-primary" />
              <span>{format(new Date(schedule.startTime), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-primary" />
              <span>
                {format(new Date(schedule.startTime), 'h:mm a')} - {format(new Date(schedule.endTime), 'h:mm a')}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Video className="h-6 w-6 text-primary" />
              <span>Virtual Meeting ({schedule.duration} minutes)</span>
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h3 className="font-semibold">Participants ({schedule.userMeetings.length})</h3>
            </div>
            <div className="space-y-2">
              {schedule.userMeetings.map((participant) => (
                <div key={participant.id} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={participant.user.image || ''} />
                    <AvatarFallback>{participant.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <span>{participant.user.name}</span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={addToCalendar} className="w-full">
            <Calendar className="mr-2 h-4 w-4" />
            Add to Calendar
          </Button>
        </div>

        {/* Right Column - Chat */}
        <div className="col-span-9 border rounded-lg p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5" />
            <h3 className="font-semibold">Chat</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto mb-4 space-y-2">
            {messages.map((message, index) => (
              <div key={index} className="bg-muted p-2 rounded">
                <span className="font-semibold">{message.user}: </span>
                {message.text}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1 rounded border p-2"
              placeholder="Type your message..."
            />
            <Button 
              onClick={() => {
                if (messageInput.trim()) {
                  setMessages([...messages, { user: "You", text: messageInput.trim() }]);
                  setMessageInput("");
                }
              }}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}