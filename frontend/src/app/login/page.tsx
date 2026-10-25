import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo, PawPrint, PeekingCat } from "@/components/cats";
import { LanguageMenu } from "@/components/language-switcher";
import { getI18n } from "@/i18n/server";
import { getCurrentUser } from "@/server/session";
import { GoogleSignInButton } from "./google-button";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.meta.login };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/");
  const { t } = await getI18n();
  const { error } = await searchParams;
  const code = typeof error === "string" ? error : undefined;
  const errors: Record<string, string> = t.login.errors;
  const message = code ? (errors[code] ?? t.login.errors.fallback) : null;

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="paw-pattern relative hidden overflow-hidden bg-sidebar p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo className="h-10 w-10 text-[#ffd9b8]" />
        <div className="space-y-6">
          <BoardIllustration />
          <h2 className="max-w-md text-3xl font-bold leading-tight">{t.login.heroTitle}</h2>
          <p className="max-w-md text-white/60">{t.login.heroText}</p>
        </div>
        <p className="flex items-center gap-2 text-sm text-white/40">
          <PawPrint className="h-3.5 w-3.5 text-pink" /> {t.login.footer}
        </p>
      </section>

      <section className="relative flex items-center justify-center bg-app px-6 py-16">
        <div className="absolute top-4 right-4">
          <LanguageMenu />
        </div>
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-3">
            <PeekingCat className="w-28 lg:hidden" />
            <h1 className="text-3xl font-bold">{t.login.title}</h1>
            <p className="text-fg-2">{t.login.subtitle}</p>
          </div>

          {message && (
            <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
              {message}
            </p>
          )}

          <GoogleSignInButton />

          <p className="text-xs leading-relaxed text-fg-2">
            {t.login.firstUserNote}
          </p>
        </div>
      </section>
    </main>
  );
}

const ILLUSTRATION_COLUMNS = [
  [["w-3/4", "bg-danger"], ["w-2/3", "bg-warning"]],
  [["w-4/5", "bg-warning"], ["w-1/2", "bg-pink"]],
  [["w-2/3", "bg-success"], ["w-3/4", "bg-success"]],
];

function BoardIllustration() {
  return (
    <div aria-hidden className="relative max-w-md pt-16">
      {/* Mèo ló đầu, hai chân bám mép trên của bảng */}
      <PeekingCat className="absolute top-1 left-1/2 w-32 -translate-x-1/2" />
      <div className="grid grid-cols-3 gap-3">
        {ILLUSTRATION_COLUMNS.map((col, i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-white/10 p-2">
            {col.map(([w, color], j) => (
              <div key={j} className="space-y-2 rounded-xl bg-white/[0.06] p-3">
                <div className={`h-2 rounded-full bg-white/70 ${w}`} />
                <div className="h-1.5 w-1/2 rounded-full bg-white/25" />
                <div className="h-1 rounded-full bg-white/10">
                  <div className={`h-1 rounded-full ${color}`} style={{ width: "60%" }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
