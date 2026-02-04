import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Dashboard } from "@/components/dashboard";
import { LandingPage } from "@/components/landing-page";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (session) return <Dashboard session={session} />;

  return <LandingPage />;
}
