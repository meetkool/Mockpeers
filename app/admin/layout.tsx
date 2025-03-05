import { Sidebar } from "./components/sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  // Check if this is the login page
  const isLoginPage = children.props?.childProp?.segment === 'login';

  // If on login page and already authenticated as admin, redirect to dashboard
  if (isLoginPage && session?.user?.role === 'ADMIN') {
    redirect('/admin');
  }

  // Return login page without sidebar
  if (isLoginPage) {
    return <div className="min-h-screen">{children}</div>;
  }

  // All other admin pages include sidebar
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
}
