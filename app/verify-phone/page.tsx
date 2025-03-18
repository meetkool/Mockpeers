import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/authOptions";
import { PhoneVerification } from "@/app/components/auth/PhoneVerification";
import { prisma } from "@/lib/prisma";

export default async function VerifyPhonePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPhoneVerified: true, phoneNumber: true }
  });

  if (!user) {
    redirect("/login");
  }

  if (user.isPhoneVerified) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6">
      <h1 className="text-2xl font-bold mb-4">Verify Your Phone Number</h1>
      <p className="mb-4">Please verify your phone number to continue using the platform.</p>
      <PhoneVerification />
    </div>
  );
}
