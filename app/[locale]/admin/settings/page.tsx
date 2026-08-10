import { Metadata } from "next";
import { AdminSettingsPage } from "./AdminSettingsPage";

export const metadata: Metadata = {
  title: "Settings - Admin",
  description: "Platform settings and configuration",
};

export default function SettingsPage() {
  return <AdminSettingsPage />;
}
