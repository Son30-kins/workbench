import Link from "next/link";
import { CatInBox } from "@/components/cats";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <CatInBox className="w-48" />
      <p className="text-5xl font-extrabold text-brand">404</p>
      <h1 className="text-xl font-bold">{t.notFound.title}</h1>
      <p className="text-fg-2">{t.notFound.text}</p>
      <Link href="/" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary">
        {t.notFound.back}
      </Link>
    </main>
  );
}
