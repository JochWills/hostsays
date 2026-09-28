import type { CurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updatePassword, updateProfile } from "@/lib/actions/account";
import { ActionForm, Row, TextField } from "./form";
import { panel, sectionTitle } from "@/components/ui/styles";

/** "Your login" section on every settings page: name, phone, password. */
export async function AccountSettings({ user }: { user: CurrentUser }) {
  const db = await createClient();
  const { data: profile } = await db.from("profiles").select("full_name, phone").eq("id", user.id).single();
  return (
    <>
      <section className={panel}>
        <h2 className={sectionTitle}>Your details</h2>
        <p className="mt-1 mb-4 text-[14px] text-muted">Signed in as {user.email}.</p>
        <ActionForm action={updateProfile} submitLabel="Save">
          <Row>
            <TextField name="fullName" label="Your name" autoComplete="name" defaultValue={profile?.full_name} />
            <TextField name="phone" label="Phone (WhatsApp)" type="tel" autoComplete="tel" defaultValue={profile?.phone} />
          </Row>
        </ActionForm>
      </section>
      <section className={`${panel} mt-5`}>
        <h2 className={sectionTitle}>Password</h2>
        <p className="mt-1 mb-4 text-[14px] text-muted">
          Set a password to sign in without waiting for an email. You can still use emailed links.
        </p>
        <ActionForm action={updatePassword} submitLabel="Save password">
          <Row>
            <TextField name="password" label="New password" type="password" autoComplete="new-password" hint="At least 8 characters." />
            <TextField name="confirm" label="Type it again" type="password" autoComplete="new-password" />
          </Row>
        </ActionForm>
      </section>
    </>
  );
}
