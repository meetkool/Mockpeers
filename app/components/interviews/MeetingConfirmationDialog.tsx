"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

interface MeetingConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: {
    id: string;
    startTime: string;
  };
  onAddToCalendar: () => void;
}

export function MeetingConfirmationDialog({
  isOpen,
  onClose,
  schedule,
  onAddToCalendar,
}: MeetingConfirmationDialogProps) {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/rooms/${schedule.id}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Meeting Scheduled Successfully!</DialogTitle>
        </DialogHeader>

        <div className="py-4 text-center">
          <p className="mb-4">
            Your meeting has been scheduled successfully. You can view all the details and join the meeting from the dedicated room page.
          </p>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onAddToCalendar}>
            <Calendar className="mr-2 h-4 w-4" />
            Add to Calendar
          </Button>
          <Button onClick={handleViewDetails}>
            View Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}