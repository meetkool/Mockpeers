"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Github } from "lucide-react";
import { signIn } from "next-auth/react";
import { Appbar } from "../components/Appbar";

export default function SignUp() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const profession = searchParams.get('profession');

    useEffect(() => {
        // If no profession is selected, redirect to get-started
        if (!profession) {
            router.replace('/get-started');
        }
    }, [profession, router]);

    const handleGoogleSignIn = () => {
        // Store profession in localStorage before OAuth flow
        if (profession) {
            localStorage.setItem('selectedProfession', profession);
        }
        signIn('google', { callbackUrl: '/' });
    };

    const handleGithubSignIn = () => {
        // Store profession in localStorage before OAuth flow
        if (profession) {
            localStorage.setItem('selectedProfession', profession);
        }
        signIn('github', { callbackUrl: '/' });
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
                                variant="outline"
                                className="w-full"
                                onClick={handleGoogleSignIn}
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="currentColor"/>
                                </svg>
                                Continue with Google
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleGithubSignIn}
                            >
                                <Github className="w-5 h-5 mr-2" />
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
