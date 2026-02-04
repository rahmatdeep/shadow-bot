import { AuthPageLayout } from "@/components/auth-page-layout";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <AuthPageLayout
      title="Join Shadow Bot"
      subtitle="Intelligent meeting capture for high-performance teams."
    >
      <AuthForm mode="signup" />
    </AuthPageLayout>
  );
}
