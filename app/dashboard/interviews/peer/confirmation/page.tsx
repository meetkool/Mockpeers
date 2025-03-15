"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import Link from "next/link";

export default function InterviewConfirmation() {
  const addToCalendar = () => {
    // Generate Google Calendar URL
    const event = {
      text: "Mock Interview Session",
      dates: "20250312T150000Z/20250312T160000Z", // Replace with actual date
      details: "What's next?\n\nYou can join the session 10 minutes prior to the start time.\n\nMake sure your audio and video devices are working ahead of time.",
      location: "Virtual Meeting"
    };

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${event.dates}&text=${encodeURIComponent(event.text)}&details=${encodeURIComponent(event.details)}&location=${encodeURIComponent(event.location)}`;
    window.open(calendarUrl, '_blank');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-4">Interview Scheduled!</h1>
          
          <p className="mb-6">
            Your interview is scheduled for Wednesday, March 12, at 8:30 PM.
          </p>

          <div className="flex gap-4 mb-6">
            <Button onClick={addToCalendar}>
              <Calendar className="mr-2 h-4 w-4" />
              Add to Calendar
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/dashboard/interviews/peer">
                Schedule Another
              </Link>
            </Button>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Important Notes:</h2>
            <ul className="space-y-2 text-sm">
              <li>• Join 10 minutes before the scheduled time</li>
              <li>• Test your audio and video beforehand</li>
              <li>• Have a stable internet connection</li>
              <li>• Keep your resume handy</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}