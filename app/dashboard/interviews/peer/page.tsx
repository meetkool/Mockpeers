"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function PeerInterviewLevel() {
  const router = useRouter();

  const handleLevelSelect = (level: string) => {
    router.push(`/dashboard/interviews/peer/schedule?level=${level.toLowerCase()}`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Select Your Experience Level</h1>
      <p className="text-muted-foreground mb-8">
        This will be used to help match you with the best partner
      </p>

      <div className="grid gap-6">
        {["Beginner", "Intermediate", "Advanced"].map((level) => (
          <Card 
            key={level} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleLevelSelect(level)}
          >
            <CardHeader>
              <CardTitle>{level}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {getLevelDescription(level)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function getLevelDescription(level: string): string {
  switch (level) {
    case "Beginner":
      return "0-2 years of experience. Perfect for those new to technical interviews.";
    case "Intermediate":
      return "2-5 years of experience. Suitable for those with some interview experience.";
    case "Advanced":
      return "5+ years of experience. For experienced developers seeking challenging practice.";
    default:
      return "";
  }
}