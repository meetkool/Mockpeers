import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github, Twitter, LinkedinIcon, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { Appbar } from "../components/Appbar";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Appbar />
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        {/* Main About Card */}
        <Card className="rounded-2xl shadow-lg border bg-white dark:bg-gray-900">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-4">
              <Image
                src="/logo-black-256x256.png"  // Add your logo here
                alt="Company Logo"
                width={60}
                height={60}
                className="rounded-full"
              />
              <div>
                <h1 className="text-2xl font-bold">Your Company Name</h1>
                <p className="text-sm text-gray-500">Established 2024</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-gray-600 dark:text-gray-300">
              We're building the next generation of developer tools. Our mission is to make development faster, easier, and more enjoyable.
            </p>
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {[
                { title: "Fast Development", desc: "Build 10x faster with our tools" },
                { title: "Modern Stack", desc: "Using latest technologies" },
                { title: "Great Support", desc: "24/7 developer support" },
                { title: "Open Source", desc: "Contribute to our community" },
              ].map((feature) => (
                <div key={feature.title} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{feature.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button variant="outline" size="sm" className="gap-2">
              <Github size={16} />
              GitHub
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Twitter size={16} />
              Twitter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <LinkedinIcon size={16} />
              LinkedIn
            </Button>
          </CardFooter>
        </Card>

        {/* Team Section */}
        <Card className="mt-6 rounded-2xl shadow-lg border bg-white dark:bg-gray-900">
          <CardHeader>
            <h2 className="text-xl font-bold">Our Team</h2>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "John Doe", role: "Founder & CEO", image: "/team/john.jpg" },
              { name: "Jane Smith", role: "CTO", image: "/team/jane.jpg" },
              { name: "Mike Johnson", role: "Lead Developer", image: "/team/mike.jpg" },
            ].map((member) => (
              <div key={member.name} className="text-center space-y-2">
                <div className="w-24 h-24 mx-auto rounded-full bg-gray-200 dark:bg-gray-700" />
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.role}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="mt-6 rounded-2xl shadow-lg border bg-black text-white">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-2">Get in Touch →</h3>
            <p className="text-gray-300 mb-4">Have questions? We'd love to hear from you.</p>
            <Button variant="outline" className="text-black border-white hover:bg-black hover:text-white">
              Contact Us <ArrowUpRight size={16} className="ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
