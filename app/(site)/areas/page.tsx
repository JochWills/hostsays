import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pageTitle } from "@/components/ui/styles";
import { getLiveAreas } from "@/lib/data/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Areas along the Eastern Cape coast",
  description: "Find things to do in Gqeberha, Addo, Kenton-on-Sea and more, recommended by local hosts.",
  alternates: { canonical: "/areas" },
};

export default async function AreasPage() {
  const areas = await getLiveAreas();

  return (
    <div className="wrap pt-8">
      <h1 className={pageTitle}>Areas along the coast</h1>
      <p className="mt-2 max-w-[640px] text-muted">We only list areas where local hosts have picks ready. More are on the way.</p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/${a.slug}`}
              className="group flex h-full flex-col rounded-[14px] bg-surface p-5 shadow-card transition-transform duration-200 hover:-translate-y-0.5"
            >
              <span className="flex items-center justify-between text-[18px] font-bold">
                {a.name}
                <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" className="text-green transition-transform group-hover:translate-x-0.5" />
              </span>
              {a.intro && <span className="mt-1.5 text-[14px] leading-[1.5] text-muted">{a.intro}</span>}
            </Link>
          </li>
        ))}
      </ul>
      {areas.length === 0 && <p className="mt-8 text-muted">Areas are coming soon.</p>}
    </div>
  );
}
