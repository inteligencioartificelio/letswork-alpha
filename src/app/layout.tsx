import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { PRESETS } from "@/lib/presets";
import { Toaster } from "sonner";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "LetsWork Alpha — Gestor de Proyectos y Tareas",
  description:
    "Sistema brutalista de gestión de proyectos y tareas para equipos. Estética tinta electrónica.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const preset = PRESETS.find((p) => p.id === (user?.themePreset ?? "00")) ?? PRESETS[0];
  const dualInk = user?.dualInkMode ?? true;
  const compact = user?.compactLayout ?? false;

  const htmlStyle = dualInk
    ? { "--color-accent-highlight": preset.ink } as React.CSSProperties
    : undefined;

  return (
    <html
      lang="es"
      data-theme={preset.id}
      className={compact ? "compact-mode" : undefined}
      style={htmlStyle}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-paper text-ink selection:bg-ink selection:text-paper antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--color-bg-paper)",
              color: "var(--color-ink-primary)",
              border: "1px solid var(--color-ink-border)",
              borderRadius: "var(--radius)",
              fontFamily: "var(--font-editorial)",
            },
          }}
        />
      </body>
    </html>
  );
}
