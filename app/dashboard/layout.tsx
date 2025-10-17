"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Book, User2, LayoutDashboard, Video, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OAuthProfessionHandler } from "@/app/components/auth/OAuthProfessionHandler";

const sidebarItems = [
  {
    title: "Main",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Interviews",
    href: "/dashboard/interviews",
    icon: Video,
  },
  {
    title: "Instructions",
    href: "/dashboard/instructions",
    icon: Book,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User2,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen flex dark:bg-gray-950">
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed top-0 left-0 h-screen z-30",
          "transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Collapse button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute -right-3 top-6",
            "flex items-center justify-center",
            "w-6 h-6 rounded-full",
            "bg-white dark:bg-gray-900",
            "border border-gray-200 dark:border-gray-800",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            "transition-colors duration-200",
            "z-50"
          )}
        >
          <Menu 
            className={cn(
              "h-3 w-3 transition-transform duration-200",
              isCollapsed ? "rotate-180" : "rotate-0"
            )}
          />
        </button>

        {/* Sidebar content */}
        <div className={cn(
          "h-full",
          "border-r bg-white dark:bg-gray-900 dark:border-gray-800",
          "flex flex-col"
        )}>
          <div className="h-14 flex items-center px-4">
            {!isCollapsed && <h1 className="text-lg font-semibold">Dashboard</h1>}
          </div>
          <Separator />
          
          {/* Navigation Items */}
          <nav className="flex-1 p-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 mb-1 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section with Logout */}
          <div className="p-4 border-t dark:border-gray-800">
            <Button
              variant="ghost"
              className={cn(
                "w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950",
                isCollapsed ? "px-2" : "gap-2"
              )}
              onClick={handleSignOut}
              title={isCollapsed ? "Sign out" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && "Sign out"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "flex-1",
        isCollapsed ? "ml-16" : "ml-64"
      )}>
        <header className="h-14 border-b bg-white dark:bg-gray-900 dark:border-gray-800 fixed top-0 right-0 left-0 z-20">
          <div className={cn(
            "h-full px-6 flex items-center justify-between",
            isCollapsed ? "ml-16" : "ml-64"
          )}>
            <h2 className="text-lg font-medium">
              {sidebarItems.find((item) => item.href === pathname)?.title || "Dashboard"}
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                  <User2 className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="p-6 mt-14">{children}</main>
        <OAuthProfessionHandler />
      </div>
    </div>
  );
}
