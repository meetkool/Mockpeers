"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Book, User2, LayoutDashboard, Video, LogOut, Sun, Moon, Menu } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
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
  const { theme, setTheme } = useTheme();
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
      {/* Sidebar with relative positioning */}
      <div className="relative">
        {/* Collapse button positioned absolutely on the right border */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute -right-4 top-1/2 -translate-y-1/2",
            "flex items-center justify-center",
            "w-8 h-8 rounded-full",
            "bg-white dark:bg-gray-900",
            "border border-gray-200 dark:border-gray-800",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            "transition-colors duration-200",
            "z-50"
          )}
        >
          <Menu 
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isCollapsed ? "rotate-180" : "rotate-0"
            )}
          />
        </button>

        {/* Sidebar content */}
        <div className={cn(
          "border-r bg-white dark:bg-gray-900 dark:border-gray-800 flex flex-col transition-all duration-300 h-screen",
          isCollapsed ? "w-16" : "w-64"
        )}>
          <div className="p-4 flex items-center gap-2">
            {!isCollapsed && <h1 className="text-xl font-semibold">Dashboard</h1>}
          </div>
          <Separator />
          
          {/* Navigation Items */}
          <nav className="p-2 flex-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
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

          {/* Bottom Section with Theme Toggle and Logout */}
          <div className="p-4 border-t dark:border-gray-800">
            <div className={cn(
              "flex items-center mb-4",
              isCollapsed ? "flex-col gap-4" : "justify-between"
            )}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950",
                  isCollapsed ? "p-2" : "gap-2"
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
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="h-14 border-b bg-white dark:bg-gray-900 dark:border-gray-800">
          <div className="h-full px-6 flex items-center justify-between">
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
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
