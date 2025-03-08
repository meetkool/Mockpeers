"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Appbar } from "../components/Appbar";

const professions = [
    { id: "Software Engineer", label: "Software Engineer" },
    { id: "Frontend Developer", label: "Frontend Developer" },
    { id: "Backend Developer", label: "Backend Developer" },
    { id: "Fullstack Developer", label: "Fullstack Developer" },
    { id: "DevOps Engineer", label: "DevOps Engineer" },
];

export default function GetStarted() {
    const [profession, setProfession] = useState("");
    const router = useRouter();
    const { data: session } = useSession();

    const handleContinue = () => {
        if (profession) {
            console.log("Selected profession:", profession); // Debug log
            sessionStorage.setItem('selectedProfession', profession);
            router.push(`/signup?profession=${encodeURIComponent(profession)}`);
        }
    };

    // If user is authenticated, don't render the page content
    if (session?.user) {
        return null; // or a loading spinner if you prefer
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Appbar />
            <main className="flex-grow container mx-auto px-4 py-12">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>What's your profession?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup
                            value={profession}
                            onValueChange={setProfession}
                            className="space-y-4"
                        >
                            {professions.map((prof) => (
                                <div key={prof.id} className="flex items-center space-x-2">
                                    <RadioGroupItem value={prof.id} id={prof.id} />
                                    <Label htmlFor={prof.id}>{prof.label}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                        <Button
                            className="w-full mt-6"
                            onClick={handleContinue}
                            disabled={!profession}
                        >
                            Continue
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
