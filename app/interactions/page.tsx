
import { Appbar } from "../components/Appbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function InteractionsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Appbar />
      <div className="container mx-auto py-8 px-4">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Mock Interview Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                By using the Mock Interview feature, you acknowledge that you have read and agreed to our Terms and Conditions.
              </AlertDescription>
            </Alert>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="overview">
                <AccordionTrigger>Overview</AccordionTrigger>
                <AccordionContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    The Mock Interview feature allows you to practice your coding interview skills with real people.
                    You can either match with a random user or practice with a friend.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="random-match">
                <AccordionTrigger>Mock Interview With Random Users</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>Match with another user for a 2-hour session where you:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Take turns being interviewer and interviewee</li>
                      <li>Work on randomly assigned coding questions</li>
                      <li>Use a shared coding workspace</li>
                      <li>Must own a platform subscription to use this feature</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="friend-match">
                <AccordionTrigger>Mock Interview With a Friend</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>Create a private session with a friend where you can:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Choose or get randomly assigned questions</li>
                      <li>Select your role (interviewer/interviewee)</li>
                      <li>Share a special link for a 1-hour session</li>
                      <li>Only the host needs a subscription</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="process">
                <AccordionTrigger>Interview Process</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Before the Interview:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Get question 24 hours in advance (as interviewer)</li>
                      <li>Prepare the question thoroughly</li>
                      <li>Review solutions in interviewee's preferred language</li>
                    </ul>
                    
                    <Separator className="my-4" />
                    
                    <h4 className="font-semibold">During the Interview:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>45 minutes for problem-solving</li>
                      <li>10 minutes for feedback and debrief</li>
                      <li>Use shared workspace and video call</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="rules">
                <AccordionTrigger>Rules and Requirements</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Technical Requirements:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Stable internet connection</li>
                      <li>Working microphone</li>
                      <li>Webcam (recommended)</li>
                    </ul>
                    
                    <Separator className="my-4" />
                    
                    <h4 className="font-semibold">Rules:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Be respectful and professional</li>
                      <li>Show up on time or cancel in advance</li>
                      <li>Maximum two consecutive cancellations allowed</li>
                      <li>Inappropriate behavior may result in account termination</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}