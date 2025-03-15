import { UserAuthForm } from "@/app/components/auth/UserAuthForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <div className="flex-grow flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
        </CardHeader>
        <CardContent>
          <UserAuthForm mode="signup" />
        </CardContent>
      </Card>
    </div>
  );
}