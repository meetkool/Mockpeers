import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { Users, MessageSquare, Video, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

interface WaitingRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: {
    id: string;
    startTime: string;
    endTime: string;
    meetingUrl: string | null;
    duration: number;
    waitTime: number;
  };
  participants: Array<{
    id: string;
    user: {
      name: string;
      image: string | null;
    };
  }>;
  showMeetingLink?: boolean;
}

interface TimerState {
  message: string;
  type: 'waiting_to_start' | 'in_waiting_room' | 'in_meeting' | 'completed';
  color: string;
}

export function WaitingRoomDialog({
  isOpen,
  onClose,
  schedule,
  participants,
  showMeetingLink = false
}: WaitingRoomDialogProps) {
  const [timerState, setTimerState] = useState<TimerState>({
    message: '',
    type: 'waiting_to_start',
    color: 'text-blue-600'
  });

  const updateTimer = useCallback(() => {
    const now = new Date().getTime();
    const startTime = new Date(schedule.startTime).getTime();
    const waitingEndTime = startTime + (schedule.waitTime * 60 * 1000); // Convert minutes to milliseconds
    const endTime = new Date(schedule.endTime).getTime();

    const formatTimeLeft = (ms: number) => {
      const minutes = Math.floor(ms / (1000 * 60));
      const seconds = Math.floor((ms % (1000 * 60)) / 1000);
      return `${minutes}m ${seconds}s`;
    };

    // Meeting has ended
    if (now > endTime) {
      setTimerState({
        message: 'Meeting has ended',
        type: 'completed',
        color: 'text-red-600'
      });
      return;
    }

    // In active meeting
    if (now >= waitingEndTime && now < endTime) {
      const timeLeft = endTime - now;
      setTimerState({
        message: `Meeting in progress - ${formatTimeLeft(timeLeft)} remaining`,
        type: 'in_meeting',
        color: 'text-green-600'
      });
      if (schedule.meetingUrl && !window.location.href.includes(schedule.meetingUrl)) {
        window.open(schedule.meetingUrl, '_blank');
      }
      return;
    }

    // In waiting room
    if (now >= startTime && now < waitingEndTime) {
      const timeLeft = waitingEndTime - now;
      setTimerState({
        message: `Waiting room - Meeting starts in ${formatTimeLeft(timeLeft)}`,
        type: 'in_waiting_room',
        color: 'text-blue-600'
      });
      return;
    }

    // Waiting to start
    if (now < startTime) {
      const timeLeft = startTime - now;
      setTimerState({
        message: `Meeting starts in ${formatTimeLeft(timeLeft)}`,
        type: 'waiting_to_start',
        color: 'text-gray-600'
      });
    }
  }, [schedule.startTime, schedule.endTime, schedule.waitTime, schedule.meetingUrl]);

  useEffect(() => {
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [updateTimer]);

  const addToCalendar = () => {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Waiting Room</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-12 gap-4 h-full">
          {/* Meeting Details Section */}
          <div className="col-span-3 space-y-6">
            {/* Timer Banner */}
            <div className={`p-4 rounded-lg text-center ${
              timerState.type === 'completed' ? 'bg-red-100' :
              timerState.type === 'in_meeting' ? 'bg-green-100' :
              timerState.type === 'in_waiting_room' ? 'bg-blue-100' :
              'bg-gray-100'
            }`}>
              <h3 className={`text-xl font-semibold ${timerState.color}`}>
                {timerState.message}
              </h3>
              {timerState.type === 'completed' && (
                <div className="mt-2 text-sm text-red-600">
                  This meeting is no longer active
                </div>
              )}
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
                <h3 className="font-semibold">Participants ({participants.length})</h3>
              </div>
              <div className="space-y-2">
                {participants.map((participant) => (
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

            {/* Reminders */}
            <div className="space-y-2">
              <h3 className="font-semibold">Reminders</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span>
                  Test your audio and video beforehand
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span>
                  Have a stable internet connection
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span>
                  Keep your resume handy
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button onClick={addToCalendar} className="w-full" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Add to Calendar
              </Button>
            </div>
          </div>

          {/* Chat Section */}
          {/* <div className={`col-span-9 border rounded-lg p-4 flex flex-col ${
            timerState.type === 'completed' ? 'opacity-50 pointer-events-none' : ''
          }`}>
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
                placeholder="Type a message..."
              />
              <Button onClick={() => {
                if (messageInput.trim()) {
                  setMessages([...messages, { user: "You", text: messageInput }]);
                  setMessageInput("");
                }
              }}>Send</Button>
            </div>
          </div> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}