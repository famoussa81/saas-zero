import { Metadata } from "next";
import { AdminUsersPage } from "./AdminUsersPage";

export const metadata: Metadata = {
  title: "Users - Admin",
  description: "Manage platform users and their access",
};

export default function UsersPage() {
  return <AdminUsersPage />;
}
