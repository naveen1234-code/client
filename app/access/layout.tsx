import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gym Ravana Access",
  description: "Quick member access app for Gym Ravana.",
  manifest: "/access-manifest.json",
  themeColor: "#dc2626",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function AccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}