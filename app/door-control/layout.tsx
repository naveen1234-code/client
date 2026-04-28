import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Gym Ravana Door Control",
  description: "Admin-only remote door unlock app for Gym Ravana.",
  manifest: "/door-control-manifest.json",
  appleWebApp: {
    capable: true,
    title: "Door Control",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function DoorControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}