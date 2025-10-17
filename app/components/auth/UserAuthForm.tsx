"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export function UserAuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [loading, setLoading] = useState(false);

  // Get profession from URL query parameter
  useEffect(() => {
    const professionParam = searchParams.get('profession');
    if (professionParam) {
      setProfession(professionParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, profession: profession || undefined }),
        });

        if (res.ok) {
          const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          if (result?.ok) {
            toast.success("Account created and logged in successfully");
            router.push("/dashboard");
          }
        } else {
          toast.error("Registration failed");
        }
      } else {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.ok) {
          toast.success("Logged in successfully");
          router.push("/dashboard");
        } else {
          toast.error("Invalid credentials");
        }
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      // Store profession in localStorage to retrieve after OAuth callback
      if (profession) {
        localStorage.setItem('oauth_profession', profession);
      }
      
      await signIn(provider, { callbackUrl: '/dashboard' });
    } catch (error) {
      toast.error(`${provider} login failed`);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Loading..." : mode === 'signup' ? "Sign Up" : "Sign In"}
        </Button>
      </form>

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => handleSocialLogin('google')}
        >
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => handleSocialLogin('github')}
        >
          Continue with GitHub
        </Button>
      </div>
    </div>
  );
}