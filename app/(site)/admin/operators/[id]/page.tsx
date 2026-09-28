import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getMemberLogins, getOperatorForAdmin } from "@/lib/data/portal";
import { getAllAreas } from "@/lib/data/public";
import { formatRand } from "@/lib/format";
import { firstValues } from "@/lib/validation/explore";
import { adminDeleteOperator, adminSaveOperator } from "../../edit-actions";
import { AccountActions } from "@/components/portal/admin-buttons";
import { ActionForm, CheckboxField, Row, SelectField, TextArea, TextField } from "@/components/portal/form";
import { DeleteZone } from "@/components/portal/delete-zone";
import { Members } from "@/components/portal/members";
import { Notice, PageHeading, StatusPill } from "@/components/portal/ui";
import { btnSecondary, panel, sectionTitle } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Edit operator", robots: { index: false, follow: false } };

export default async function AdminOperator({ params, searchParams }: PageProps<"/admin/operators/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams.then(firstValues)]);
  await requireRole("admin", `/admin/operators/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [o, areas] = await Promise.all([getOperatorForAdmin(id), getAllAreas()]);
  if (!o) notFound();
  const members = await getMemberLogins(o.operator_members);
  const n = o.experiences.length;
  const theirExperiences = n === 0 ? "no experiences" : n === 1 ? "their 1 experience" : `all ${n} of their experiences`;
  const priv = o.operator_private;
  const agreed = priv?.terms_accepted_at
    ? new Date(priv.terms_accepted_at).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" })
    : null;

  return (
    <>
      <Link href="/admin/operators" className="text-[14px] font-semibold text-green hover:underline">
        &larr; All operators
      </Link>
      <div className="mt-3" />
      <PageHeading
        title={o.name}
        intro={
          <span className="flex flex-wrap items-center gap-2">
            <StatusPill status={o.status} />
            {o.is_demo && <span className="rounded-full bg-panel px-2 py-0.5 text-[12px] font-semibold text-muted">Demo</span>}
            {o.status === "verified" && (
              <Link href={`/o/${o.slug}`} className="inline-flex items-center gap-1 font-semibold text-green hover:underline">
                View their page <ExternalLink size={14} aria-hidden="true" />
              </Link>
            )}
          </span>
        }
        actions={<AccountActions kind="operator" id={o.id} name={o.name} status={o.status} />}
      />

      {sp.error === "kept" && <Notice tone="warn">This operator has bookings or strikes on record, so they can&rsquo;t be deleted. Suspend them instead.</Notice>}
      <Members members={members} />

      <section className={`${panel} mb-6`}>
        <h2 className={sectionTitle}>Details</h2>
        <p className="mt-1 mb-4 text-[14px] text-muted">
          Name, area, description and website show on their page. Changes show on the site straight away.
        </p>
        <ActionForm action={adminSaveOperator.bind(null, o.id)} submitLabel="Save">
          <Row>
            <TextField name="name" label="Business name" defaultValue={o.name} />
            <SelectField name="areaId" label="Area" options={areas.map((a) => ({ value: a.id, label: a.name, group: a.province }))} defaultValue={o.area_id} />
          </Row>
          <TextArea name="description" label="About the business" rows={5} defaultValue={o.description} />
          <TextField name="website" label="Website or social page" inputMode="url" defaultValue={o.website} />
          <Row>
            <TextField name="contactEmail" label="Booking email" type="email" defaultValue={priv?.contact_email} hint="Booking requests go here." />
            <TextField name="contactPhone" label="Business phone (WhatsApp)" type="tel" defaultValue={priv?.contact_phone} />
          </Row>
          <CheckboxField name="isDemo" defaultChecked={o.is_demo} label="Demo operator (a placeholder until the real business agrees)" />
        </ActionForm>
        <p className="mt-4 text-[13px] text-muted">{agreed ? `Agreed to the operator terms on ${agreed}.` : "Hasn't agreed to the operator terms yet."}</p>
      </section>

      <section className={`${panel} mb-6`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className={sectionTitle}>Experiences ({o.experiences.length})</h2>
          <Link href={`/admin/operators/${o.id}/new`} className={`${btnSecondary} !px-3.5 !py-2 !text-[13.5px]`}>
            <Plus size={16} aria-hidden="true" /> Add an experience
          </Link>
        </div>
        {o.experiences.length === 0 ? (
          <p className="text-[15px] text-muted">None yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {o.experiences.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                <Link href={`/admin/experiences/${e.id}`} className="min-w-0 flex-1 font-semibold hover:underline">
                  {e.title}
                </Link>
                <span className="text-[14px] text-muted">
                  {formatRand(e.price_cents)} {e.is_group_price ? "per group" : "pp"}
                </span>
                <StatusPill status={e.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <DeleteZone
        action={adminDeleteOperator}
        id={o.id}
        title="Delete this operator"
        body={`Removes them for good: their page, ${theirExperiences} (with photos and host picks) and their sign-in account. To take them off the site for now, use Suspend instead.`}
        confirm={`Delete ${o.name}, ${theirExperiences} and their sign-in account for good? This can't be undone.`}
        label="Delete operator"
      />
    </>
  );
}
