import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/server";
import { userService } from "@/modules/user/services/user.service";
import { notificationService } from "@/modules/notification/services/notification.service";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getUser().catch(() => null);
  if (!authUser) redirect("/login");

  const user = await userService.getById(authUser.id).catch(() => null);
  if (!user) redirect("/login");

  // If onboarding not complete, redirect to onboarding
  if (!userService.isOnboardingComplete(user)) {
    const step = userService.getOnboardingStep(user);
    redirect(`/onboarding/${step}`);
  }

  const unreadNotifications = await notificationService.getUnread(authUser.id).catch(() => []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar user={user} initialUnreadCount={unreadNotifications.length} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppTopbar user={user} initialUnreadCount={unreadNotifications.length} />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
