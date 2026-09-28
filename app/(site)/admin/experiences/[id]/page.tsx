import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { categoryLabel } from "@/lib/categories";
import { formatDuration, formatRand, formatTime } from "@/lib/format";
import { WEEKDAYS, WEEKDAY_ORDER } from "@/lib/dates";
import { publicImageUrl } from "@/lib/storage";
import { ListingActions } from "@/components/portal/admin-buttons";
import { PageHeading, StatusPill } from "@/components/portal/ui";
import { panel, sectionTitle } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Review experience", robots: { index: false, follow: false } };

export default async function AdminExperience({ params }: PageProps<"/admin/experiences/[id]">) {
  const { id } = await params;
  await requireRole("admin", `/admin/experiences/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = createAdminClient();
  const { data: e } = await db
    .from("experiences")
    .select("*, operators(name, slug, status), areas(name), experience_photos(id, path, alt, sort_order), experience_slots(id, weekday, start_time, capacity)")
    .eq("id", id)
    .maybeSingle();
  if (!e) notFound();
  const photos = [...e.experience_photos].sort((a, b) => a.sort_order - b.sort_order);

  const row = (label: string, value: React.ReactNode) => (
    <div className="grid gap-1 py-2.5 sm:grid-cols-[170px_1fr]">
      <dt className="text-[14px] font-semibold text-muted">{label}</dt>
      <dd className="text-[15px] whitespace-pre-line">{value || "—"}</dd>
    </div>
  );

  return (
    <>
      <Link href="/admin/experiences" className="text-[14px] font-semibold text-green hover:underline">
        &larr; All experiences
      </Link>
      <div className="mt-3" />
      <PageHeading title={e.title} intro={<span className="flex items-center gap-2"><StatusPill status={e.status} /> by {e.operators?.name} ({e.operators?.status})</span>} actions={<ListingActions id={e.id} title={e.title} status={e.status} />} />

      {photos.length > 0 && (
        <ul className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => (
            <li key={p.id} className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-panel">
              <Image src={publicImageUrl("experience-photos", p.path)} alt={p.alt} fill sizes="(min-width: 980px) 260px, 45vw" className="object-cover" />
            </li>
          ))}
        </ul>
      )}

      <section className={panel}>
        <dl className="divide-y divide-line">
          {row("Category", categoryLabel(e.category))}
          {row("Area", e.areas?.name)}
          {row("Summary", e.summary)}
          {row("Description", e.description)}
          {row("Price", `${formatRand(e.price_cents)} ${e.is_group_price ? "per group" : "per person"}`)}
          {row("Length", formatDuration(e.duration_minutes))}
          {row("Group size", `${e.min_people}–${e.max_people} people`)}
          {row("Included", e.included.join("\n"))}
          {row("What to bring", e.what_to_bring.join("\n"))}
          {row("Meeting point", e.meeting_point)}
          {row("Map link", e.meeting_point_map_url && <a href={e.meeting_point_map_url} target="_blank" rel="noopener noreferrer nofollow" className="text-green hover:underline">{e.meeting_point_map_url}</a>)}
          {row("Operator's terms", e.operator_cancellation_terms)}
        </dl>
      </section>

      <section className={`${panel} mt-6`}>
        <h2 className={sectionTitle}>Weekly times</h2>
        <ul className="mt-2 text-[15px]">
          {WEEKDAY_ORDER.flatMap((d) =>
            e.experience_slots
              .filter((s) => s.weekday === d)
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((s) => (
                <li key={s.id} className="py-1">
                  <span className="inline-block w-[110px] font-semibold">{WEEKDAYS[d]}</span>
                  {formatTime(s.start_time)} · up to {s.capacity}
                </li>
              )),
          )}
          {e.experience_slots.length === 0 && <li className="text-muted">None</li>}
        </ul>
      </section>
    </>
  );
}
