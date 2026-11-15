import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travel Itinerary Planner",
  description:
    "Enter a city and your interests to generate a personalised day trip itinerary.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
