import { Appbar } from "@/app/components/Appbar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Appbar />
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
}