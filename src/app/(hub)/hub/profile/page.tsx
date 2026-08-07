import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { Panel } from "@/components/ui/Panel";
import { ProfileDetailsForm } from "@/features/profile/components/ProfileDetailsForm";
import { ResetPasswordButton } from "@/features/profile/components/ResetPasswordButton";
import { ProfilePerformanceSection } from "@/features/profile/components/ProfilePerformanceSection";
import { BackgroundAnimationPreference } from "@/features/profile/components/BackgroundAnimationPreference";
import { getProfileDetails, getProfileIdentity } from "@/features/profile/data/profileDetails";
import { getOwnProfilePerformance } from "@/features/profile/data/memberPerformance";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";

export default async function ProfilePage() {
  const access = await getCurrentPinsHubAccess();
  if (!access.access) return <AppShell pinsHubAccess={access}><PageHeader title="Profile" /></AppShell>;
  const identity = await getProfileIdentity(access);
  const [profile, performance] = await Promise.all([getProfileDetails(access, identity), getOwnProfilePerformance(access, identity)]);
  const now = new Date();
  return <AppShell pinsHubAccess={access}><PageHeader title="Profile" />{profile ? <><Panel title="Account details"><ProfileDetailsForm profile={profile} /></Panel><Panel title="Appearance"><BackgroundAnimationPreference /></Panel><ProfilePerformanceSection performance={performance?.performance ?? null} initialYear={now.getFullYear()} initialMonth={now.getMonth() + 1} /><Panel title="Password"><ResetPasswordButton /></Panel></> : <ErrorState title="Profile unavailable" />}</AppShell>;
}
