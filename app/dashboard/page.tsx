"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Bot, UserPlus } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Choose Your Practice Mode</h1>
        <p className="text-muted-foreground">Select how you want to practice your interview skills</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Practice with Peers */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <CardTitle>Practice with Peers</CardTitle>
            <CardDescription>
              Connect with other developers and practice interviews together
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
              <li>• Match with developers of similar experience</li>
              <li>• Give and receive feedback</li>
              <li>• Build your network</li>
              <li>• Flexible scheduling</li>
            </ul>
            <Button className="w-full" asChild>
              <Link href="/dashboard/interviews/peer">Get Started</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Practice with AI */}
        <Card className="hover:shadow-lg transition-shadow border-2 border-purple-500">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
              <Bot className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
            <CardTitle>Practice with AI</CardTitle>
            <CardDescription>
              Premium AI-powered mock interviews available 24/7
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
              <li>• Realistic AI interviewer</li>
              <li>• Instant feedback</li>
              <li>• Available anytime</li>
              <li>• Personalized difficulty levels</li>
            </ul>
            <Button className="w-full bg-purple-600 hover:bg-purple-700" asChild>
              <Link href="/dashboard/interviews/ai">Try Premium</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Practice with Friend */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <CardTitle>Practice with a Friend</CardTitle>
            <CardDescription>
              Invite a friend for a mock interview session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
              <li>• Send direct invitations</li>
              <li>• Comfortable environment</li>
              <li>• Custom interview format</li>
              <li>• Shared feedback session</li>
            </ul>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/dashboard/interviews/friend">Invite Friend</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Section */}
      {/* <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Practice Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+3 this week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">From 8 reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Practice Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Total hours practiced</p>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}
