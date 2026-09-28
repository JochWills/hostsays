import type { Metadata } from "next";
import { requireHost } from "@/lib/portal";
import { getHostSettings } from "@/lib/data/portal";
import { getAllAreas } from "@/lib/data/public";
import { HOST_TYPES } from "@/lib/validation/auth";
import { saveBankDetails, saveHostDetails } from "../actions";
import { AccountSettings } from "@/components/portal/account-settings";
import { ActionForm, CheckboxField, Row, SelectField, TextField } from "@/components/portal/form";
import { PageHeading } from "@/components/portal/ui";
import { panel, sectionTitle } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };

export default async function HostSettings() {
  const { user, host } = await requireHost("/host/settings");
  const [s, areas] = await Promise.all([getHostSettings(host.id), getAllAreas()]);

  return (
    <>
      <PageHeading title="Settings" />
      <section className={`${panel} mb-5`}>
        <h2 className={sectionTitle}>Your place</h2>
        <p className="mt-1 mb-4 text-[14px] text-muted">
          Listing we verified: <a href={s.listing_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-green hover:underline">{s.listing_url}</a>
        </p>
        <ActionForm action={saveHostDetails} submitLabel="Save">
          <TextField name="name" label="Property name" defaultValue={s.name} />
          <Row>
            <SelectField name="hostType" label="Type of place" options={HOST_TYPES} defaultValue={s.type} />
            <SelectField name="areaId" label="Area" options={areas.map((a) => ({ value: a.id, label: a.name, group: a.province }))} defaultValue={s.area_id} />
          </Row>
          <Row>
            <TextField name="contactEmail" label="Contact email" type="email" defaultValue={s.contact_email} hint="For HostSays to reach you. Not shown on the site." />
            <TextField name="contactPhone" label="Contact phone (WhatsApp)" type="tel" defaultValue={s.contact_phone} />
          </Row>
        </ActionForm>
      </section>

      <section id="bank" className={`${panel} mb-5 scroll-mt-6`}>
        <h2 className={sectionTitle}>Bank details for payouts</h2>
        <p className="mt-1 mb-4 text-[14px] text-muted">Only you and the HostSays team can see these. We pay commission by EFT each month.</p>
        <ActionForm action={saveBankDetails} submitLabel="Save bank details">
          <Row>
            <TextField name="accountName" label="Account holder" defaultValue={s.bank?.account_name} />
            <TextField name="bankName" label="Bank" defaultValue={s.bank?.bank_name} placeholder="e.g. FNB" />
          </Row>
          <Row>
            <TextField name="accountNumber" label="Account number" inputMode="numeric" defaultValue={s.bank?.account_number} />
            <TextField name="branchCode" label="Branch code" inputMode="numeric" defaultValue={s.bank?.branch_code} hint="Universal branch codes work, e.g. 250655 for FNB." />
          </Row>
          <CheckboxField name="confirm" label="I confirm these details are correct and the account can receive payments." />
        </ActionForm>
      </section>

      <AccountSettings user={user} />
    </>
  );
}
