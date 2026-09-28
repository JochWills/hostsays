import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp, ImageIcon, Plus, Trash2 } from "lucide-react";
import { requireHost } from "@/lib/portal";
import { getHostPicks } from "@/lib/data/portal";
import { getAllLiveExperiences, getLiveAreas } from "@/lib/data/public";
import { TIP_MAX_LENGTH } from "@/lib/config";
import { formatRand } from "@/lib/format";
import { publicImageUrl } from "@/lib/storage";
import { firstValues } from "@/lib/validation/explore";
import { addPick, movePick, removePick, updateTip } from "../actions";
import { ActionForm, ConfirmButton, TextArea } from "@/components/portal/form";
import { Notice, PageHeading } from "@/components/portal/ui";
import { panel, sectionTitle } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Your picks", robots: { index: false, follow: false } };

const iconBtn = "grid size-9 cursor-pointer place-items-center rounded-[10px] text-muted hover:bg-panel hover:text-ink disabled:cursor-default disabled:opacity-30";

function Thumb({ path }: { path: string | null }) {
  return (
    <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-panel text-muted">
      {path ? <Image src={publicImageUrl("experience-photos", path)} alt="" fill sizes="64px" className="object-cover" /> : <ImageIcon size={20} aria-hidden="true" />}
    </span>
  );
}

export default async function HostPicks({ searchParams }: PageProps<"/host/picks">) {
  const { host } = await requireHost("/host/picks");
  const [picks, all, areas, sp] = await Promise.all([getHostPicks(host.id), getAllLiveExperiences(), getLiveAreas(), searchParams.then(firstValues)]);
  const verified = host.status === "verified";
  const picked = new Set(picks.map((p) => p.experience.id));
  const area = areas.find((a) => a.slug === sp.area);
  const choices = all.filter((e) => !picked.has(e.id) && (!area || e.area.id === area.id));
  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-[14px] font-semibold ${active ? "border-green bg-green text-green-ink" : "border-line bg-surface hover:border-green"}`;

  return (
    <>
      <PageHeading
        title="Your picks"
        intro={`The experiences on your storefront, in this order. Each needs a short tip in your own words (up to ${TIP_MAX_LENGTH} characters).`}
      />
      {!verified && <Notice tone="warn">You can add picks once we&rsquo;ve verified your listing. We&rsquo;ll email you.</Notice>}

      {picks.length > 0 && (
        <ol className="mb-8 space-y-3">
          {picks.map((p, i) => (
            <li key={p.id} className={panel}>
              <div className="flex items-start gap-3">
                <Thumb path={p.experience.photoPath} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    <span className="text-muted">{i + 1}.</span>{" "}
                    <Link href={`/x/${p.experience.slug}`} className="hover:underline">
                      {p.experience.title}
                    </Link>
                  </p>
                  <p className="text-[14px] text-muted">
                    {p.experience.operatorName} · {p.experience.areaName}
                    {!p.experience.live && " · not currently live"}
                    {p.isHidden && " · hidden by HostSays"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center">
                  <form action={movePick}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="dir" value="up" />
                    <button type="submit" className={iconBtn} disabled={i === 0} aria-label={`Move ${p.experience.title} up`}>
                      <ArrowUp size={17} aria-hidden="true" />
                    </button>
                  </form>
                  <form action={movePick}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="dir" value="down" />
                    <button type="submit" className={iconBtn} disabled={i === picks.length - 1} aria-label={`Move ${p.experience.title} down`}>
                      <ArrowDown size={17} aria-hidden="true" />
                    </button>
                  </form>
                  <form action={removePick}>
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmButton message={`Remove ${p.experience.title} from your picks?`} className={`${iconBtn} hover:!text-danger`} aria-label={`Remove ${p.experience.title}`}>
                      <Trash2 size={17} aria-hidden="true" />
                    </ConfirmButton>
                  </form>
                </div>
              </div>
              <div className="mt-3">
                <ActionForm action={updateTip.bind(null, p.id)} submitLabel="Save tip" className="space-y-3">
                  <TextArea name="tip" label="Your tip" rows={2} maxLength={TIP_MAX_LENGTH} defaultValue={p.tip} />
                </ActionForm>
              </div>
            </li>
          ))}
        </ol>
      )}

      <section>
        <h2 className={sectionTitle}>Add a pick</h2>
        <div className="mt-3 mb-4 flex flex-wrap gap-2">
          <Link href="/host/picks" className={chip(!area)}>
            All areas
          </Link>
          {areas.map((a) => (
            <Link key={a.id} href={`/host/picks?area=${a.slug}`} className={chip(area?.id === a.id)}>
              {a.name}
            </Link>
          ))}
        </div>
        {choices.length === 0 ? (
          <p className={`${panel} text-[15px] text-muted`}>
            {all.length === 0 ? "No experiences are live yet." : "You've picked everything here. Try another area."}
          </p>
        ) : (
          <ul className="space-y-3">
            {choices.map((e) => (
              <li key={e.id} className={panel}>
                <div className="flex items-start gap-3">
                  <Thumb path={e.photo?.path ?? null} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      <Link href={`/x/${e.slug}`} className="hover:underline">
                        {e.title}
                      </Link>
                    </p>
                    <p className="text-[14px] text-muted">
                      {e.operator.name} · {e.area.name} · {formatRand(e.priceCents)} {e.isGroupPrice ? "per group" : "pp"}
                      {e.hostCount > 0 && ` · ${e.hostCount} host${e.hostCount === 1 ? "" : "s"} recommend`}
                    </p>
                  </div>
                </div>
                {verified && (
                  <details className="group mt-3">
                    <summary className="w-fit cursor-pointer list-none group-open:mb-3 [&::-webkit-details-marker]:hidden">
                      <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-line px-3.5 py-2 text-[14px] font-semibold hover:border-green">
                        <Plus size={16} aria-hidden="true" /> <span className="group-open:hidden">Recommend this</span>
                        <span className="hidden group-open:inline">Cancel</span>
                      </span>
                    </summary>
                    <ActionForm action={addPick.bind(null, e.id)} submitLabel="Add to my picks" className="space-y-3">
                      <TextArea
                        name="tip"
                        label="Your tip for guests"
                        rows={2}
                        maxLength={TIP_MAX_LENGTH}
                        placeholder="e.g. Book the morning drive: the elephants come down to the waterhole early."
                      />
                    </ActionForm>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
