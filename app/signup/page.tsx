"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Github } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { Appbar } from "../components/Appbar";

export default function SignUp() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const profession = searchParams.get('profession');

    useEffect(() => {
        const updateProfession = async () => {
            if (status === 'authenticated' && session?.user && profession) {
                try {
                    const response = await fetch('/api/user/profession', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ profession }),
                    });

                    if (response.ok) {
                        console.log('Profession updated successfully');
                        router.push('/dashboard');
                    } else {
                        console.error('Failed to update profession');
                    }
                } catch (error) {
                    console.error('Error updating profession:', error);
                }
            }
        };

        updateProfession();
    }, [status, session, profession]);

    const handleSignIn = async (provider: 'google' | 'github') => {
        if (!profession) {
            router.replace('/get-started');
            return;
        }

        try {
            const result = await signIn(provider, {
                callbackUrl: `/signup?profession=${encodeURIComponent(profession)}`,
                redirect: true,
            });
        } catch (error) {
            console.error('Sign in error:', error);
        }
    };

    // If no profession, show loading or return null
    if (!profession) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Appbar />
            <main className="flex-grow container mx-auto px-4 py-12">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Create your account</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            <Button 
                                onClick={() => handleSignIn('google')} 
                                className="w-full"
                            >
                                Continue with Google
                            </Button>
                            <Button 
                                onClick={() => handleSignIn('github')} 
                                className="w-full"
                            >
                                Continue with GitHub
                            </Button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <Separator />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or continue with email
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" />
                            </div>
                            <div>
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" />
                            </div>
                            <Button className="w-full">Sign Up</Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
