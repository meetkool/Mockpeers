import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/authOptions";
import { PhoneVerification } from "@/app/components/auth/PhoneVerification";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function VerifyPhonePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check if already verified - direct database check
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPhoneVerified: true }
  });

  // If already verified, redirect to dashboard
  if (user?.isPhoneVerified) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-center">Verify Your Phone</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
          Verify your phone number to unlock all features
        </p>
        <PhoneVerification />
      </div>
    </div>
  );
}
