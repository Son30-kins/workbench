import type { Metadata, Viewport } from "next";
import { Exo_2 } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "ManagementTask", template: "%s · ManagementTask" },
  description: "Quản lý công việc: form mẫu tự sinh task, ưu tiên, nhắc việc qua Telegram.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#2a2b2f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${exo2.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
