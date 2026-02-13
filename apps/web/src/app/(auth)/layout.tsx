"use client";

import { AuthPageLayout } from "@/components/auth-page-layout";
import { AuthForm } from "@/components/auth-form";
import { usePathname } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const mode = isLoginPage ? "login" : "signup";

  const title = isLoginPage ? "Welcome Back" : "Join Shadow Bot";
  const subtitle = isLoginPage
    ? "Access your intelligent meeting logs and summaries."
    : "Intelligent meeting capture for high-performance teams.";

  return (
    <AuthPageLayout title={title} subtitle={subtitle}>
      <AuthForm mode={mode} />
      {children}
    </AuthPageLayout>
  );
}
