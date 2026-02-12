import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { ToastProvider } from "@/context/ToastContext";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Lavanderia - Gestão Profissional",
  description: "Sistema profissional de gestão de lavanderia com armazenamento em nuvem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="dark" className="dark">
      <body>
        <AuthProvider>
          <AppProvider>
            <ToastProvider>
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
