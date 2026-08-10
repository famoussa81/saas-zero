import { Metadata } from "next";
import { AdminAnalyticsPage } from "./AdminAnalyticsPage";

export const metadata: Metadata = {
  title: "Analytics - Admin",
  description: "Platform metrics and insights",
};

export default function AnalyticsPage() {
  return <AdminAnalyticsPage />;
}
