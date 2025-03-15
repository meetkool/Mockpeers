// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/lib/auth";

// export async function POST(request: Request) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session?.user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { date, time } = await request.json();
//     const dateTime = new Date(`${date}T${time}`);

//     // Create the schedule
//     const schedule = await prisma.schedule.create({
//       data: {
//         title: "Peer Interview Practice",
//         startTime: dateTime,
//         endTime: new Date(dateTime.getTime() + 60 * 60 * 1000), // 1 hour duration
//         duration: 60,
//         status: "CONFIRMED",
//       },
//     });

//     // Create user meeting record
//     await prisma.userMeeting.create({
//       data: {
//         userId: session.user.id,
//         scheduleId: schedule.id,
//         level: session.user.level || "BEGINNER",
//       },
//     });

//     return NextResponse.json(schedule);
//   } catch (error) {
//     return NextResponse.json({ error: "Failed to book interview" }, { status: 500 });
//   }
// }