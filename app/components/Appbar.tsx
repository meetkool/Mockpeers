"use client"

import { signIn, signOut, useSession } from "next-auth/react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Github, LogOut } from "lucide-react";
import Image from 'next/image';

export function Appbar() {
    const session = useSession();
    
    const handleGoogleSignIn = () => {
        signIn('google', { callbackUrl: '/' });
    };

    const handleGithubSignIn = () => {
        signIn('github', { callbackUrl: '/' });
    };

    return (
        <div className="bg-black text-white shadow-xl shadow-gray-900/30 rounded-full mx-auto mt-4 max-w-5xl border border-gray-800">
            <div className="flex h-14 items-center px-6 container mx-auto justify-between">
            <div className="flex items-center gap-6 md:gap-12"> 
    <Link href="/" className="flex items-center gap-3 md:gap-4">
        <Image 
            src="/logo-white-256x256.png"  
            alt="Logo"
            width={28}  
            height={28} 
            priority
        />
        <span className="text-lg font-semibold tracking-wide">Mockpeers</span>
    </Link>

    <NavigationMenu className="ml-auto">
        <NavigationMenuList className="flex gap-4 md:gap-6">
            <NavigationMenuItem>
                <Link href="/" legacyBehavior passHref>
                    <NavigationMenuLink className="text-white hover:text-gray-300 transition-all duration-200 px-3 py-2 rounded-md bg-gray-900 hover:bg-gray-700">
                        Home
                    </NavigationMenuLink>
                </Link>
            </NavigationMenuItem>
            {/* <NavigationMenuItem>
                <Link href="/pricing" legacyBehavior passHref>
                    <NavigationMenuLink className="text-white hover:text-gray-300 transition-all duration-200 px-3 py-2 rounded-md bg-gray-900 hover:bg-gray-700">
                        Pricing
                    </NavigationMenuLink>
                </Link>
            </NavigationMenuItem> */}
        </NavigationMenuList>
    </NavigationMenu>

                <div className="flex items-center space-x-4">
                    {session.data?.user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-400">
                                {session.data.user.name || session.data.user.email}
                            </span>
                            <Button 
                                variant="ghost"
                                size="icon"
                                onClick={() => signOut()}
                                className="bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2"
                            >
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Button 
                                variant="ghost"
                                onClick={handleGoogleSignIn}
                                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="currentColor"/>
                                </svg>
                                Google
                            </Button>
                            <Button 
                                variant="ghost"
                                onClick={handleGithubSignIn}
                                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full"
                            >
                                <Github className="w-5 h-5" />
                                GitHub
                            </Button>
                        </div>
                    )}
                    </div>
                </div>
            </div>
        </div>
    );
}





