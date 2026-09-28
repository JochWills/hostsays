import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pageTitle } from "@/components/ui/styles";
import { getProvinces } from "@/lib/data/public";
import { provinceInSentence } from "@/lib/format";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Where to go in South Africa",
  description: "Browse things to do by province and town, recommended by local hosts. Starting on the Eastern Cape coast.",
  alternates: { canonical: "/areas" },
};

export default async function AreasPage() {
  const provinces = await getProvinces();

  return (
    <div className="wrap pt-8">
      <h1 className={pageTitle}>Where to go</h1>
      <p className="mt-2 max-w-[640px] text-muted">
        Pick a province, then a town. We&rsquo;re starting on the Eastern Cape coast, with more of South Africa on the way.
      </p>

      <div className="mt-8 space-y-9">
        {provinces.map((p) => (
          <section key={p.id} aria-labelledby={`p-${p.slug}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id={`p-${p.slug}`} className="text-[22px] font-bold tracking-[-0.01em]">
                <Link href={`/${p.slug}`} className="hover:underline">
                  {p.name}
                </Link>
              </h2>
              <Link href={`/${p.slug}`} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-green hover:underline">
                {p.areas.length ? `All of ${provinceInSentence(p.name)}` : "Coming soon"} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            {p.intro && <p className="mt-1 max-w-[640px] text-[14.5px] text-muted">{p.intro}</p>}

            {p.areas.length > 0 && (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {p.areas.map((a) => (
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
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
