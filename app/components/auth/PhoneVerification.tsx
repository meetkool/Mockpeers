'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { countryCodes } from "@/lib/constants/countryCodes";

export function PhoneVerification() {
  const router = useRouter();
  const { update } = useSession();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [country, setCountry] = useState("IN");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      setError("Please enter a valid phone number");
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError(""); // Clear previous errors
    try {
      const res = await fetch("/api/auth/verify-phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phoneNumber: `${countryCode}${phoneNumber}`,
          country 
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send verification code");
        throw new Error(data.error);
      }

      setCodeSent(true);
      toast.success("Verification code sent to your phone");
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      setError('Please enter the verification code');
      toast.error('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError(""); // Clear previous errors
    try {
      const res = await fetch("/api/auth/verify-phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to verify code");
        throw new Error(data.error);
      }

      toast.success("Phone number verified successfully");
      
      // Update the session to reflect the phone verification
      await update();
      
      // Use hard redirect to ensure session is fully refreshed
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast.error(error.message || "Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {!codeSent ? (
        <>
          <div className="flex gap-2">
            <Select value={countryCode} onValueChange={(value) => {
              const selected = countryCodes.find(c => c.code === value);
              if (selected) {
                setCountryCode(value);
                setCountry(selected.iso);
              }
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countryCodes.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="tel"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              className="flex-1"
            />
          </div>
          <Button
            onClick={handleSendCode}
            disabled={loading || !phoneNumber}
            className="w-full"
          >
            {loading ? "Sending..." : "Send Verification Code"}
          </Button>
        </>
      ) : (
        <>
          <Input
            type="text"
            placeholder="Enter 6-digit verification code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
          />
          <Button
            onClick={handleVerifyCode}
            disabled={loading || code.length !== 6}
            className="w-full"
          >
            {loading ? "Verifying..." : "Verify Code"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCodeSent(false);
              setError("");
            }}
            disabled={loading}
            className="w-full"
          >
            Change Phone Number
          </Button>
        </>
      )}
    </div>
  );
}