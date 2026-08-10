import { Metadata } from "next";
import { AdminOrganizationsPage } from "./AdminOrganizationsPage";

export const metadata: Metadata = {
  title: "Organizations - Admin",
  description: "Manage organizations and teams",
};

export default function OrganizationsPage() {
  return <AdminOrganizationsPage />;
}
