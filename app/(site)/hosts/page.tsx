import type { Metadata } from "next";
import Link from "next/link";
import { HostGrid } from "@/components/cards/host-card";
import { pageTitle } from "@/components/ui/styles";
import { getHostCards, getProvinces } from "@/lib/data/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Hosts who know the area",
  description: "Guesthouses, B&Bs and local hosts across South Africa, and the experiences they recommend.",
  alternates: { canonical: "/hosts" },
};

export default async function HostsPage() {
  const [hosts, provinces] = await Promise.all([getHostCards({ featuredFirst: true }), getProvinces({ allAreas: true })]);

  // Group by province (each card already shows its town), keeping provinces in the order their first host appears.
  const provinceOf = new Map(provinces.flatMap((p) => p.areas.map((a) => [a.slug, p] as const)));
  const groups = new Map<string, { name: string; slug: string | null; hosts: typeof hosts }>();
  for (const h of hosts) {
    const p = h.area ? provinceOf.get(h.area.slug) : undefined;
    const key = p?.slug ?? "other";
    if (!groups.has(key)) groups.set(key, { name: p?.name ?? "Elsewhere", slug: p?.slug ?? null, hosts: [] });
    groups.get(key)!.hosts.push(h);
  }
  const single = groups.size === 1;

  return (
    <div className="wrap pt-8">
      <h1 className={pageTitle}>Hosts who know the area</h1>
      <p className="mt-2 max-w-[640px] text-muted">
        Every host here is verified. Open a host&rsquo;s page to see what they tell their own guests to do.
      </p>

      {hosts.length === 0 && <p className="mt-8 text-muted">Hosts are joining now. Check back soon.</p>}

      {[...groups.values()].map((g) => (
        <section key={g.name} aria-label={g.name} className="mt-8">
          {!single && (
            <h2 className="mb-3 text-[20px] font-bold">
              {g.slug ? <Link href={`/${g.slug}`} className="hover:text-green">{g.name}</Link> : g.name}
            </h2>
          )}
          <HostGrid hosts={g.hosts} />
        </section>
      ))}

      <p className="mt-10 text-[14px] text-muted">
        Run a guesthouse, B&amp;B or holiday home?{" "}
        <Link href="/for-hosts" className="font-semibold text-green hover:underline">Join as a host</Link>
      </p>
    </div>
  );
}
