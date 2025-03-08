import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Instructions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview Instructions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Before the Interview</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Test your microphone and camera</li>
            <li>Ensure you have a stable internet connection</li>
            <li>Find a quiet, well-lit space</li>
            <li>Have your IDE ready if required</li>
          </ul>

          <h3 className="text-lg font-semibold">During the Interview</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Communicate your thought process clearly</li>
            <li>Ask clarifying questions when needed</li>
            <li>Manage your time effectively</li>
            <li>Test your solution with examples</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}