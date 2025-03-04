import { Appbar } from "./components/Appbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Users, Calendar, Video } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Appbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
            Welcome to Mockpeers
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Your platform for realistic technical interview practice. Connect with peers, practice coding interviews, and boost your confidence.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/practice">
                Start Practice <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/about">How It Works</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="transform hover:scale-105 transition-transform">
            <CardContent className="pt-6">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900 w-12 h-12 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Peer Matching</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get matched with peers or practice with friends for mock interviews.
              </p>
            </CardContent>
          </Card>

          <Card className="transform hover:scale-105 transition-transform">
            <CardContent className="pt-6">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900 w-12 h-12 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexible Scheduling</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Book interview slots that work best for your timezone.
              </p>
            </CardContent>
          </Card>

          <Card className="transform hover:scale-105 transition-transform">
            <CardContent className="pt-6">
              <div className="rounded-full bg-green-100 dark:bg-green-900 w-12 h-12 flex items-center justify-center mb-4">
                <Video className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Live Interviews</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Real-time video interviews with Google Meet integration.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-black text-white rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Ace Your Next Interview?</h2>
          <p className="mb-6 text-gray-300">
            Join Mockpeers today and practice with a community of developers.
          </p>
          <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black">
            <Link href="/practice">Get Started Now</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}