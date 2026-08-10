import { Metadata } from "next";
import { AdminSubscriptionsPage } from "./AdminSubscriptionsPage";

export const metadata: Metadata = {
  title: "Subscriptions - Admin",
  description: "Monitor and manage all subscriptions",
};

export default function SubscriptionsPage() {
  return <AdminSubscriptionsPage />;
}
