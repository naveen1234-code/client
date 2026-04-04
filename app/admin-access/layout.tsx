import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gym Ravana Admin",
  description: "Dedicated admin control app for Gym Ravana.",
  manifest: "/admin-manifest.json",
  themeColor: "#dc2626",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function AdminAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}