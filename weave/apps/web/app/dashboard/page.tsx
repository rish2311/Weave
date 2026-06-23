import type { Metadata } from "next";
import { DashboardContent } from "../../components/editor/DashboardContent";

export const metadata: Metadata = {
  title: "Dashboard – Weave",
  description: "Manage your Weave projects",
};

export default function DashboardPage() {
  return <DashboardContent />;
}
