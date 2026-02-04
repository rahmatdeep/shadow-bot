import { AuthPageLayout } from "@/components/auth-page-layout";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <AuthPageLayout
      title="Welcome Back"
      subtitle="Access your intelligent meeting logs and summaries."
    >
      <AuthForm mode="login" />
    </AuthPageLayout>
  );
}
