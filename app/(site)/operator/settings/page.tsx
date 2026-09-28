import type { Metadata } from "next";
import { requireOperator } from "@/lib/portal";
import { getOperatorSettings } from "@/lib/data/portal";
import { getAllAreas } from "@/lib/data/public";
import { saveOperatorDetails } from "../actions";
import { AccountSettings } from "@/components/portal/account-settings";
import { ActionForm, Row, SelectField, TextArea, TextField } from "@/components/portal/form";
import { PageHeading } from "@/components/portal/ui";
import { panel, sectionTitle } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

export default async function OperatorSettings() {
  const { user, operator } = await requireOperator("/operator/settings");
  const [s, areas] = await Promise.all([getOperatorSettings(operator.id), getAllAreas()]);
  const agreed = s.terms_accepted_at
    ? new Date(s.terms_accepted_at).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" })
    : null;

  return (
    <>
      <PageHeading title="Settings" />
      <section className={`${panel} mb-5`}>
        <h2 className={sectionTitle}>Your business</h2>
        <p className="mt-1 mb-4 text-[14px] text-muted">Your name, area, description and website show on your operator page.</p>
        <ActionForm action={saveOperatorDetails} submitLabel="Save">
          <Row>
            <TextField name="name" label="Business name" defaultValue={s.name} />
            <SelectField name="areaId" label="Area" options={areas.map((a) => ({ value: a.id, label: a.name, group: a.province }))} defaultValue={s.area_id} />
          </Row>
          <TextArea name="description" label="About your business" rows={5} defaultValue={s.description} hint="Who you are and what you do, in a few friendly sentences." />
          <TextField name="website" label="Website or social page" inputMode="url" defaultValue={s.website} />
          <Row>
            <TextField name="contactEmail" label="Booking email" type="email" defaultValue={s.contact_email} hint="Booking requests go here. Never shown to guests." />
            <TextField name="contactPhone" label="Business phone (WhatsApp)" type="tel" defaultValue={s.contact_phone} hint="Given to guests only after they've paid." />
          </Row>
        </ActionForm>
        {agreed && <p className="mt-4 text-[13px] text-muted">You agreed to the operator terms on {agreed}.</p>}
      </section>
      <AccountSettings user={user} />
    </>
  );
}
