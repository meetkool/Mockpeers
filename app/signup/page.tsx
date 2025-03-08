"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Github } from "lucide-react";
import { Appbar } from "../components/Appbar";

export default function SignUp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const profession = searchParams.get('profession');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

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
  }, [status, session, profession, router]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Register the user
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      // Sign in the user
      const result = await signIn("user-login", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // After successful sign-in, the useEffect will handle profession update
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderSignIn = (provider: 'google' | 'github') => {
    if (!profession) {
      router.replace('/get-started');
      return;
    }

    signIn(provider, {
      callbackUrl: `/signup?profession=${encodeURIComponent(profession)}`,
    });
  };

  // If no profession, redirect to get-started
  if (!profession) {
    router.replace('/get-started');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Appbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Create an account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleProviderSignIn('google')}
              >
                Continue with Google
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleProviderSignIn('github')}
              >
                <Github className="mr-2 h-4 w-4" />
                Continue with GitHub
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
