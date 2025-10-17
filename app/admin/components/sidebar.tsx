"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  BarChart,
  VideoIcon,
  MessageSquare,
  LogOut,
  Code,
  Network,
  Database,
  Brain,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Interviews",
    href: "/admin/interviews",
    icon: VideoIcon,
  },
  // Schedule Management - Separate Modules for Each Interview Type
  {
    title: "DSA Schedules",
    href: "/admin/schedule/dsa",
    icon: Code,
    description: "Data Structures & Algorithms Schedule Module",
  },
  {
    title: "System Design Schedules",
    href: "/admin/schedule/system-design",
    icon: Network,
    description: "Technical Architecture Design Schedule Module",
  },
  {
    title: "Behavioral Schedules",
    href: "/admin/schedule/behavioral",
    icon: MessageSquare,
    description: "Work Experience Questions Schedule Module",
  },
  {
    title: "SQL Schedules",
    href: "/admin/schedule/sql",
    icon: Database,
    description: "Database Queries & Optimization Schedule Module",
    badge: "Beta",
  },
  {
    title: "Data Science Schedules",
    href: "/admin/schedule/data-science",
    icon: Brain,
    description: "Data Analysis & ML Schedule Module",
    badge: "Beta",
  },
  {
    title: "Frontend Schedules",
    href: "/admin/schedule/frontend",
    icon: Monitor,
    description: "JavaScript & Web Development Schedule Module",
    badge: "Beta",
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart,
  },
  {
    title: "Feedback",
    href: "/admin/feedback",
    icon: MessageSquare,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/admin/login' });
  };

  return (
    <div className="w-64 border-r bg-white dark:bg-gray-950 h-screen sticky top-0 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-xl font-semibold">Mockpeers Admin</span>
        </Link>
      </div>
      
      <nav className="p-4 space-y-2 flex-1">
        {sidebarItems.map((item, index) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const isScheduleModule = item.href.includes('/schedule/');
          const isFirstScheduleModule = isScheduleModule && 
            (index === 0 || !sidebarItems[index - 1].href.includes('/schedule/'));
          
          return (
            <div key={item.href}>
              {isFirstScheduleModule && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  📅 Schedule Management
                </div>
              )}
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                  isActive &&
                    "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50",
                  isScheduleModule && "ml-4 text-sm"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
