import { Suspense } from "react";
import { UserAuthForm } from "@/app/components/auth/UserAuthForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

function SignUpForm() {
  return <UserAuthForm mode="signup" />;
}

export default function SignUpPage() {
  return (
    <div className="flex-grow flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          }>
            <SignUpForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}