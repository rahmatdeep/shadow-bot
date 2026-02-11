import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GlobalChat } from "@/components/global-chat";

import { redirect } from "next/navigation";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <GlobalChat session={session} />;
}
