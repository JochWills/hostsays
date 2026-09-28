import type { Metadata } from "next";
import QRCode from "qrcode";
import { Download, Share2 } from "lucide-react";
import { requireHost } from "@/lib/portal";
import { absoluteUrl } from "@/lib/site";
import { CopyButton } from "@/components/portal/copy-button";
import { ComingSoon, PageHeading } from "@/components/portal/ui";
import { btnSecondary, input, panel, sectionTitle } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Share", robots: { index: false, follow: false } };

export default async function HostShare() {
  const { host } = await requireHost("/host/share");
  if (host.status !== "verified") {
    return (
      <>
        <PageHeading title="Share" />
        <ComingSoon icon={Share2} title="Available once you're verified">
          <p>You&rsquo;ll get your storefront link, a QR code for your rooms and a ready-made welcome message here.</p>
        </ComingSoon>
      </>
    );
  }

  const url = absoluteUrl(`/${host.slug}`);
  // The QR carries utm_source=qr so scans can be told apart in analytics; it's still a storefront visit.
  const qrUrl = `${url}?utm_source=qr`;
  const [svg, png] = await Promise.all([
    QRCode.toString(qrUrl, { type: "svg", margin: 1, color: { dark: "#1e2723", light: "#ffffff" } }),
    QRCode.toDataURL(qrUrl, { width: 1200, margin: 2, color: { dark: "#1e2723", light: "#ffffff" } }),
  ]);
  const message = `Welcome to ${host.name}! We've put together our favourite local experiences, from game drives to ocean trips, run by people we know and trust. Have a look and book here: ${url}`;

  return (
    <>
      <PageHeading title="Share" intro="Every guest who books through your storefront link earns you commission." />

      <section className={`${panel} mb-5`}>
        <h2 className={sectionTitle}>Your storefront link</h2>
        <div className="mt-3 flex flex-wrap gap-2.5">
          <input readOnly value={url} aria-label="Your storefront link" className={`${input} min-w-0 flex-1 basis-[260px]`} />
          <CopyButton text={url} label="Copy link" />
        </div>
      </section>

      <section className={`${panel} mb-5`}>
        <h2 className={sectionTitle}>QR code</h2>
        <p className="mt-1 text-[14px] text-muted">Print it for your rooms, welcome pack or reception. Guests scan it with their phone camera.</p>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <div className="size-44 rounded-[10px] border border-line bg-white p-2" role="img" aria-label="QR code for your storefront" dangerouslySetInnerHTML={{ __html: svg }} />
          <a href={png} download={`hostsays-${host.slug}-qr.png`} className={btnSecondary}>
            <Download size={16} aria-hidden="true" /> Download PNG
          </a>
        </div>
      </section>

      <section className={panel}>
        <h2 className={sectionTitle}>Welcome message</h2>
        <p className="mt-1 text-[14px] text-muted">Paste into your booking confirmation, WhatsApp or check-in email. Change it to suit you.</p>
        <p className="mt-3 rounded-[10px] bg-panel px-4 py-3 text-[15px]">{message}</p>
        <div className="mt-3">
          <CopyButton text={message} label="Copy message" />
        </div>
      </section>
    </>
  );
}
