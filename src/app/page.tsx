import { auth } from "@clerk/nextjs/server";
import dynamic from "next/dynamic";
import { LandingHero } from "@/components/landing/LandingHero";

// Lazy load dashboard (large bundle: Convex hooks, forms, charts)
// Only downloaded by authenticated users
const Dashboard = dynamic(() => import("@/components/dashboard/Dashboard").then(mod => ({ default: mod.Dashboard })));

export default async function Home() {
  const { userId } = await auth();

  // Server-side render decision - no client-side flash
  return userId ? <Dashboard /> : <LandingHero />;
}
