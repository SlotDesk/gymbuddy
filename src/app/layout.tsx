import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GymBuddy — equipment-bewusste Trainingspläne",
  description:
    "Generiere einen sicheren Trainingsplan, der exakt zu deinem Equipment und Ziel passt.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
