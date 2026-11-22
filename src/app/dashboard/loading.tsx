import { DashboardSkeleton } from "@/components/ui/Skeleton";

// Shown by Next.js automatically while a dashboard screen's server data loads,
// so the user sees the page's shape instead of a blank white screen.
export default function Loading() {
  return <DashboardSkeleton />;
}
