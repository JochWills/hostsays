import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAreasForAdmin } from "@/lib/data/portal";
import { provinceInSentence } from "@/lib/format";
import {
  adminAssignArea,
  adminCreateArea,
  adminCreateAreaFromRequest,
  adminDeleteArea,
  adminMergeArea,
  adminMoveArea,
  adminSaveArea,
} from "../area-actions";
import { ActionForm, ConfirmButton, TextArea, TextField } from "@/components/portal/form";
import { PageHeading, StatusPill } from "@/components/portal/ui";
import { Dropdown } from "@/components/ui/dropdown";
import { btnPrimary, btnSecondary, panel, sectionTitle } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Areas", robots: { index: false, follow: false } };

const small = "!px-3.5 !py-2 !text-[13.5px]";
const iconBtn = "grid size-9 cursor-pointer place-items-center rounded-[10px] text-muted hover:bg-panel hover:text-ink disabled:cursor-default disabled:opacity-30";
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default async function AdminAreas() {
  await requireRole("admin", "/admin/areas");
  const { provinces, requests } = await getAreasForAdmin();
  const allAreas = provinces.flatMap((p) => p.areas.map((a) => ({ value: a.id, label: a.name, group: p.name })));

  return (
    <>
      <PageHeading
        title="Areas"
        intro="The places travellers pick: a town or a well-known region. An area shows on the site by itself once it has a live experience or a verified host."
      />

      {requests.length > 0 && (
        <section className={`${panel} mb-6 border border-gold/50`}>
          <h2 className={sectionTitle}>Waiting for their town ({requests.length})</h2>
          <p className="mt-1 mb-4 text-[14px] text-muted">
            They chose &ldquo;Somewhere else&rdquo; when signing up. Add their town as a new area, or put them in an existing one.
          </p>
          <ul className="divide-y divide-line">
            {requests.map((r) => (
              <li key={`${r.kind}-${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3">
                <div className="min-w-0 flex-1 basis-[240px]">
                  <p className="font-semibold">
                    <Link href={`/admin/${r.kind === "host" ? "hosts" : "operators"}/${r.id}`} className="hover:underline">
                      {r.name}
                    </Link>{" "}
                    <span className="font-normal text-muted">· {r.kind}</span>
                  </p>
                  <p className="text-[14px] text-muted">
                    Asked for <b className="text-ink">{r.town}</b>
                    {r.province && <>, {r.province.name}</>}
                  </p>
                </div>
                <form action={adminCreateAreaFromRequest}>
                  <input type="hidden" name="kind" value={r.kind} />
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className={`${btnPrimary} ${small}`}>
                    <Plus size={15} aria-hidden="true" /> Add &ldquo;{r.town}&rdquo;
                  </button>
                </form>
                <form action={adminAssignArea} className="flex items-center gap-2">
                  <input type="hidden" name="kind" value={r.kind} />
                  <input type="hidden" name="id" value={r.id} />
                  <Dropdown name="areaId" options={allAreas} placeholder="Or pick an area" ariaLabel={`Area for ${r.name}`} className="w-[200px]" />
                  <button type="submit" className={`${btnSecondary} ${small}`}>
                    Assign
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {provinces.map((p) => (
        <section key={p.id} aria-labelledby={`prov-${p.slug}`} className={`${panel} mb-5`}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id={`prov-${p.slug}`} className={sectionTitle}>
              {p.name} <span className="font-normal text-muted">({p.areas.length})</span>
            </h2>
            <Link href={`/${p.slug}`} className="inline-flex items-center gap-1 text-[14px] font-semibold text-green hover:underline">
              View <ExternalLink size={13} aria-hidden="true" />
            </Link>
          </div>

          {p.areas.length > 0 && (
            <ul className="mt-3 divide-y divide-line">
              {p.areas.map((a, i) => {
                const used = a.experiences + a.hosts + a.operators;
                return (
                  <li key={a.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <div className="min-w-0 flex-1 basis-[260px]">
                        <p className="flex flex-wrap items-center gap-2 font-semibold">
                          <Link href={`/${a.slug}`} className="hover:underline">
                            {a.name}
                          </Link>
                          <StatusPill status={a.isLive ? "showing" : "hidden"} />
                        </p>
                        <p className="text-[13.5px] text-muted">
                          /{a.slug} · {plural(a.liveExperiences, "live experience")} · {plural(a.verifiedHosts, "verified host")} ·{" "}
                          {plural(a.operators, "operator")}
                          {a.oldSlugs.length > 0 && <> · also /{a.oldSlugs.join(", /")}</>}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <form action={adminMoveArea}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="dir" value="up" />
                          <button type="submit" className={iconBtn} disabled={i === 0} aria-label={`Move ${a.name} up`}>
                            <ArrowUp size={17} aria-hidden="true" />
                          </button>
                        </form>
                        <form action={adminMoveArea}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="dir" value="down" />
                          <button type="submit" className={iconBtn} disabled={i === p.areas.length - 1} aria-label={`Move ${a.name} down`}>
                            <ArrowDown size={17} aria-hidden="true" />
                          </button>
                        </form>
                        {used === 0 && (
                          <form action={adminDeleteArea}>
                            <input type="hidden" name="id" value={a.id} />
                            <ConfirmButton message={`Delete ${a.name}? Nothing is in it.`} className={`${iconBtn} hover:!text-danger`} aria-label={`Delete ${a.name}`}>
                              <Trash2 size={17} aria-hidden="true" />
                            </ConfirmButton>
                          </form>
                        )}
                      </div>
                    </div>

                    <details className="group mt-2">
                      <summary className="w-fit cursor-pointer list-none text-[14px] font-semibold text-green hover:underline [&::-webkit-details-marker]:hidden">
                        <span className="group-open:hidden">Edit or merge</span>
                        <span className="hidden group-open:inline">Close</span>
                      </summary>
                      <div className="mt-3 grid gap-5 rounded-[12px] border border-line p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                        <ActionForm action={adminSaveArea.bind(null, a.id)} submitLabel="Save">
                          <TextField name="name" label="Name" defaultValue={a.name} />
                          <TextField
                            name="slug"
                            label="Address"
                            prefix="/"
                            defaultValue={a.slug}
                            hint="Changing it keeps the old address working (it redirects)."
                          />
                          <TextArea name="intro" label="Intro (shown on its page)" rows={3} maxLength={300} defaultValue={a.intro} />
                        </ActionForm>
                        <form action={adminMergeArea} className="space-y-3">
                          <input type="hidden" name="id" value={a.id} />
                          <p className="text-[14px] font-semibold">Merge into another area</p>
                          <p className="text-[13px] text-muted">
                            Moves its {plural(a.experiences, "experience")}, {plural(a.hosts, "host")} and {plural(a.operators, "operator")} there, and
                            /{a.slug} redirects. Use it for duplicates or places that belong together.
                          </p>
                          <Dropdown
                            name="into"
                            options={allAreas.filter((o) => o.value !== a.id)}
                            placeholder="Choose the area to keep"
                            ariaLabel={`Merge ${a.name} into`}
                          />
                          <ConfirmButton message={`Merge ${a.name} into the area you chose? ${a.name} will be removed.`} className={`${btnSecondary} ${small}`}>
                            Merge
                          </ConfirmButton>
                        </form>
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}

          <details className="group mt-3">
            <summary className="w-fit cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className={`${btnSecondary} ${small}`}>
                <Plus size={15} aria-hidden="true" /> <span className="group-open:hidden">Add an area in {provinceInSentence(p.name)}</span>
                <span className="hidden group-open:inline">Cancel</span>
              </span>
            </summary>
            <div className="mt-3 rounded-[12px] border border-line p-4">
              <ActionForm action={adminCreateArea.bind(null, p.id)} submitLabel="Add area">
                <TextField name="name" label="Name" placeholder="e.g. Port Alfred, or Garden Route" />
                <TextArea name="intro" label="Intro (optional)" rows={2} maxLength={300} />
                <TextField name="slug" label="Address (optional)" prefix="/" hint="Made from the name if you leave it blank." />
              </ActionForm>
            </div>
          </details>
        </section>
      ))}
    </>
  );
}
