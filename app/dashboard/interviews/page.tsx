import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users } from "lucide-react";

export default function Interviews() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Interviews</h2>
        <Button>Schedule New Interview</Button>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Example interview card */}
              <div className="border p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <h3 className="font-semibold">Mock Interview - Frontend</h3>
                      <p className="text-sm text-gray-500">with John Doe</p>
                    </div>
                  </div>
                  <Button variant="outline">Join</Button>
                </div>
                <div className="mt-4 flex gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Tomorrow at 2:00 PM
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    1-on-1
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}