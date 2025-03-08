import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/authOptions";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { profession: true }
        });

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch profession" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { profession } = body;
        
        if (!profession) {
            return NextResponse.json({ error: "Profession is required" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: { profession },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating profession:", error);
        return NextResponse.json(
            { error: "Failed to update profession", details: error.message },
            { status: 500 }
        );
    }
}
