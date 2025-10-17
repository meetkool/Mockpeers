"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Network, MessageSquare, Database, Brain, Monitor, ArrowRight } from "lucide-react";
import Link from "next/link";


export default function SchedulePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to DSA schedules since existing schedules are DSA type
    router.replace('/admin/schedule/dsa');
  }, [router]);

  const interviewTypes = [
    {
      id: 'dsa',
      name: 'DSA Schedules',
      description: 'Data Structures & Algorithms practice sessions',
      icon: Code,
      href: '/admin/schedule/dsa',
      color: 'blue'
    },
    {
      id: 'system-design',
      name: 'System Design Schedules',
      description: 'Technical architecture design sessions',
      icon: Network,
      href: '/admin/schedule/system-design',
      color: 'purple'
    },
    {
      id: 'behavioral',
      name: 'Behavioral Schedules',
      description: 'Work experience questions sessions',
      icon: MessageSquare,
      href: '/admin/schedule/behavioral',
      color: 'green'
    },
    {
      id: 'sql',
      name: 'SQL Schedules',
      description: 'Database queries & optimization sessions',
      icon: Database,
      href: '/admin/schedule/sql',
      color: 'orange',
      badge: 'Beta'
    },
    {
      id: 'data-science',
      name: 'Data Science Schedules',
      description: 'Data analysis & ML sessions',
      icon: Brain,
      href: '/admin/schedule/data-science',
      color: 'pink',
      badge: 'Beta'
    },
    {
      id: 'frontend',
      name: 'Frontend Schedules',
      description: 'JavaScript & web development sessions',
      icon: Monitor,
      href: '/admin/schedule/frontend',
      color: 'cyan',
      badge: 'Beta'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Schedule Management</h1>
          <p className="text-muted-foreground">Manage interview schedules by type</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interviewTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card key={type.id} className="hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 text-${type.color}-600`} />
                  {type.name}
                  {type.badge && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      {type.badge}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {type.description}
                </p>
                <Link href={type.href}>
                  <Button className="w-full">
                    Manage {type.name}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
