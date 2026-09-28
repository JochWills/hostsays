import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, EyeOff, ExternalLink, Trash2, UserRound } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getHostForAdmin, getMemberLogins } from "@/lib/data/portal";
import { getAllAreas } from "@/lib/data/public";
import { HOST_TYPES } from "@/lib/validation/auth";
import { TIP_MAX_LENGTH } from "@/lib/config";
import { publicImageUrl } from "@/lib/storage";
import { firstValues } from "@/lib/validation/explore";
import { adminDeleteHost, adminRemovePick, adminSaveHost, adminSaveHostBank, adminSetPickHidden, adminUpdateTip, adminUploadHostPhoto } from "../../edit-actions";
import { AccountActions } from "@/components/portal/admin-buttons";
import { ActionForm, ConfirmButton, FileField, Row, SelectField, TextArea, TextField } from "@/components/portal/form";
import { DeleteZone } from "@/components/portal/delete-zone";
import { Members } from "@/components/portal/members";
import { Notice, PageHeading, StatusPill } from "@/components/portal/ui";
import { btnSecondary, panel, sectionTitle } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Edit host", robots: { index: false, follow: false } };

const iconBtn = "grid size-9 cursor-pointer place-items-center rounded-[10px] text-muted hover:bg-panel hover:text-ink";
/** 0.06 → "6", 0.065 → "6.5" */
const percent = (rate: number) => String(Math.round(rate * 10000) / 100);

export default async function AdminHost({ params, searchParams }: PageProps<"/admin/hosts/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams.then(firstValues)]);
  await requireRole("admin", `/admin/hosts/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [h, areas] = await Promise.all([getHostForAdmin(id), getAllAreas()]);
  if (!h) notFound();
  const members = await getMemberLogins(h.host_members);
  const priv = h.host_private;
  const bank = h.host_bank_details;

  return (
    <>
      <Link href="/admin/hosts" className="text-[14px] font-semibold text-green hover:underline">
        &larr; All hosts
      </Link>
      <div className="mt-3" />
      <PageHeading
        title={h.name}
        intro={
          <span className="flex flex-wrap items-center gap-2">
            <StatusPill status={h.status} />
            {h.status === "verified" && (
              <Link href={`/${h.slug}`} className="inline-flex items-center gap-1 font-semibold text-green hover:underline">
                hostsays.com/{h.slug} <ExternalLink size={14} aria-hidden="true" />
              </Link>
            )}
          </span>
        }
        actions={<AccountActions kind="host" id={h.id} name={h.name} status={h.status} />}
      />

      {sp.error === "kept" && <Notice tone="warn">This host has bookings or payouts on record, so they can&rsquo;t be deleted. Suspend them instead.</Notice>}
      <Members members={members} />

      <section className={`${panel} mb-6`}>
        <h2 className={sectionTitle}>Details</h2>
        <p className="mt-1 mb-4 text-[14px] text-muted">
          Changes show on the site straight away. Their storefront address (hostsays.com/{h.slug}) stays the same.
        </p>
        <ActionForm action={adminSaveHost.bind(null, h.id)} submitLabel="Save">
          <TextField name="name" label="Property name" defaultValue={h.name} />
          <Row>
            <SelectField name="hostType" label="Type of place" options={HOST_TYPES} defaultValue={h.type} />
            <SelectField name="areaId" label="Area" options={areas.map((a) => ({ value: a.id, label: a.name, group: a.province }))} defaultValue={h.area_id} />
          </Row>
          <TextField name="listingUrl" label="Listing used to verify them" inputMode="url" defaultValue={priv?.listing_url} hint="Their Booking.com, Airbnb or own website page." />
          <Row>
            <TextField name="contactEmail" label="Contact email" type="email" defaultValue={priv?.contact_email} />
            <TextField name="contactPhone" label="Contact phone (WhatsApp)" type="tel" defaultValue={priv?.contact_phone} />
          </Row>
          <Row>
            <TextField
              name="commissionPercent"
              label="Commission (%)"
              inputMode="decimal"
              defaultValue={percent(Number(priv?.commission_rate ?? 0.06))}
              hint="Of each booking total they're credited with. 6 is the founding host rate; 0–10."
            />
            <TextField
              name="featuredRank"
              label="Homepage position (optional)"
              inputMode="numeric"
              defaultValue={h.featured_rank}
              hint="1 shows first in “Hosts who know the area”. Leave blank to not feature them."
            />
          </Row>
          <TextArea name="welcomeNote" label="Storefront welcome note" rows={4} maxLength={600} defaultValue={h.welcome_note} />
        </ActionForm>
      </section>

      <section className={`${panel} mb-6`}>
        <h2 className={sectionTitle}>Storefront photo</h2>
        <div className="mt-4 flex flex-wrap items-start gap-5">
          <span className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full bg-panel text-muted">
            {h.photo_path ? (
              <Image src={publicImageUrl("host-photos", h.photo_path)} alt={`${h.name} storefront photo`} fill sizes="96px" className="object-cover" />
            ) : (
              <UserRound size={34} aria-hidden="true" />
            )}
          </span>
          <div className="min-w-[240px] flex-1">
            <ActionForm action={adminUploadHostPhoto.bind(null, h.id)} submitLabel="Upload photo" pendingLabel="Uploading…">
              <FileField name="photo" label={h.photo_path ? "Replace photo" : "Add a photo"} accept="image/jpeg,image/png,image/webp" hint="JPG, PNG or WebP, up to 5 MB." />
            </ActionForm>
          </div>
        </div>
      </section>

      <section className={`${panel} mb-6`}>
        <h2 className={sectionTitle}>Picks ({h.picks.length})</h2>
        <p className="mt-1 mb-4 text-[14px] text-muted">
          Hide a pick to take it off their storefront and the experience page without deleting their tip.
        </p>
        {h.picks.length === 0 && <p className="text-[15px] text-muted">No picks yet.</p>}
        <ol className="space-y-4">
          {h.picks.map((p, i) => {
            const e = p.experiences;
            return (
              <li key={p.id} className="rounded-[12px] border border-line p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      <span className="text-muted">{i + 1}.</span>{" "}
                      {e ? (
                        <Link href={`/admin/experiences/${e.id}`} className="hover:underline">
                          {e.title}
                        </Link>
                      ) : (
                        "Experience removed"
                      )}
                    </p>
                    <p className="text-[14px] text-muted">
                      {e && e.status !== "live" && "Not currently live · "}
                      {p.is_hidden ? "Hidden by HostSays" : "Showing"}
                    </p>
                  </div>
                  <form action={adminSetPickHidden}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="hidden" value={p.is_hidden ? "false" : "true"} />
                    <button type="submit" className={`${btnSecondary} !px-3 !py-2 !text-[13.5px]`}>
                      {p.is_hidden ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
                      {p.is_hidden ? "Show" : "Hide"}
                    </button>
                  </form>
                  <form action={adminRemovePick}>
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmButton message={`Delete this pick and ${h.name}'s tip? This can't be undone.`} className={`${iconBtn} hover:!text-danger`} aria-label={`Delete pick ${e?.title ?? ""}`}>
                      <Trash2 size={17} aria-hidden="true" />
                    </ConfirmButton>
                  </form>
                </div>
                <div className="mt-3">
                  <ActionForm action={adminUpdateTip.bind(null, p.id)} submitLabel="Save tip" className="space-y-3">
                    <TextArea name="tip" label="Their tip" rows={2} maxLength={TIP_MAX_LENGTH} defaultValue={p.tip} />
                  </ActionForm>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={`${panel} mb-6`}>
        <h2 className={sectionTitle}>Bank details for payouts</h2>
        <p className="mt-1 mb-4 text-[14px] text-muted">
          {bank
            ? `${bank.confirmed ? "Confirmed" : "Not confirmed"} · last changed ${new Date(bank.updated_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Johannesburg" })}. Only change these if the host asked you to.`
            : "Not added yet. Only add these if the host sent them to you."}
        </p>
        <ActionForm action={adminSaveHostBank.bind(null, h.id)} submitLabel="Save bank details">
          <Row>
            <TextField name="accountName" label="Account holder" defaultValue={bank?.account_name} />
            <TextField name="bankName" label="Bank" defaultValue={bank?.bank_name} />
          </Row>
          <Row>
            <TextField name="accountNumber" label="Account number" inputMode="numeric" defaultValue={bank?.account_number} />
            <TextField name="branchCode" label="Branch code" inputMode="numeric" defaultValue={bank?.branch_code} />
          </Row>
        </ActionForm>
      </section>
      <DeleteZone
        action={adminDeleteHost}
        id={h.id}
        title="Delete this host"
        body="Removes them for good: their storefront, picks, photo, bank details and their sign-in account. To take them off the site for now, use Suspend instead."
        confirm={`Delete ${h.name} and their sign-in account for good? This can't be undone.`}
        label="Delete host"
      />
    </>
  );
}
