import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, UserRound } from "lucide-react";
import { requireHost } from "@/lib/portal";
import { getHostSettings } from "@/lib/data/portal";
import { publicImageUrl } from "@/lib/storage";
import { saveWelcomeNote, uploadHostPhoto } from "../actions";
import { ActionForm, FileField, TextArea } from "@/components/portal/form";
import { Notice, PageHeading } from "@/components/portal/ui";
import { btnSecondary, panel, sectionTitle } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Storefront", robots: { index: false, follow: false } };

export default async function HostStorefront() {
  const { host } = await requireHost("/host/storefront");
  const s = await getHostSettings(host.id);
  const verified = host.status === "verified";

  return (
    <>
      <PageHeading
        title="Storefront"
        intro="Your own HostSays page: your photo, a welcome note and your picks."
        actions={
          verified ? (
            <Link href={`/${host.slug}`} className={btnSecondary}>
              View it <ExternalLink size={15} aria-hidden="true" />
            </Link>
          ) : undefined
        }
      />
      {!verified && <Notice tone="warn">Your storefront goes live once you&rsquo;re verified. You can set it up now.</Notice>}

      <section className={`${panel} mb-5`}>
        <h2 className={sectionTitle}>Photo</h2>
        <p className="mt-1 mb-4 text-[14px] text-muted">A friendly photo of you, or your place. Square works best.</p>
        <div className="flex flex-wrap items-start gap-5">
          <span className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full bg-panel text-muted">
            {s.photo_path ? (
              <Image src={publicImageUrl("host-photos", s.photo_path)} alt="Your storefront photo" fill sizes="96px" className="object-cover" />
            ) : (
              <UserRound size={34} aria-hidden="true" />
            )}
          </span>
          <div className="min-w-[240px] flex-1">
            <ActionForm action={uploadHostPhoto} submitLabel="Upload photo" pendingLabel="Uploading…">
              <FileField name="photo" label={s.photo_path ? "Replace photo" : "Add a photo"} accept="image/jpeg,image/png,image/webp" hint="JPG, PNG or WebP, up to 5 MB." />
            </ActionForm>
          </div>
        </div>
      </section>

      <section className={panel}>
        <h2 className={sectionTitle}>Welcome note</h2>
        <p className="mt-1 mb-4 text-[14px] text-muted">A few warm lines to your guests, in your own voice.</p>
        <ActionForm action={saveWelcomeNote} submitLabel="Save">
          <TextArea
            name="welcomeNote"
            label="Welcome note"
            rows={4}
            maxLength={600}
            defaultValue={s.welcome_note}
            placeholder="Welcome to Kenton! These are the trips we send our own friends on…"
          />
        </ActionForm>
      </section>
    </>
  );
}
