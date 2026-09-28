import type { Metadata } from "next";
import { ProsePage } from "@/components/site/prose-page";
import { HOST_COMMISSION_RATE, TIP_MAX_LENGTH } from "@/lib/config";
import { formatPercent } from "@/lib/format";

export const metadata: Metadata = {
  title: "For hosts: earn when your guests book",
  description:
    "Guesthouses, B&Bs, holiday homes and hotels: get a free HostSays page of your favourite local experiences and earn commission when your guests book.",
  alternates: { canonical: "/for-hosts" },
};

export default function ForHostsPage() {
  const rate = formatPercent(HOST_COMMISSION_RATE);
  return (
    <ProsePage
      title={
        <>
          Your guests ask what to do. <em className="font-serif font-semibold">Earn when they book.</em>
        </>
      }
      intro={`Get a free page with the experiences you already recommend, and earn ${rate} on every booking your guests make.`}
    >
      <h2>What you get</h2>
      <ul>
        <li>
          <strong>Your own page</strong> at hostsays.com/your-name with your picks and your tips. It replaces the paper
          &ldquo;things to do&rdquo; folder in the room.
        </li>
        <li>
          <strong>{rate} commission</strong> (our founding host rate) on every booking made by a guest who comes through
          you, on any experience, not only the ones you recommend.
        </li>
        <li>
          <strong>Share tools:</strong> a link, a QR code and a printable room card, plus a welcome message you can send
          before guests arrive.
        </li>
        <li>
          <strong>Monthly payouts</strong> by EFT in the first week of the month, with a statement.
        </li>
      </ul>
      <h2>How it works</h2>
      <ol>
        <li>Apply with a link to your Booking.com, Airbnb or own website listing.</li>
        <li>We check it&rsquo;s real and verify you.</li>
        <li>Pick the experiences you recommend and add a short tip for each (up to {TIP_MAX_LENGTH} characters).</li>
        <li>Share your page. When a guest books through it, you&rsquo;re credited automatically.</li>
      </ol>
      <h2>Who can join</h2>
      <p>Guesthouses, B&amp;Bs, self-catering, Airbnb hosts, lodges and hotels. Hotels can add staff logins.</p>
      <p>
        Recommendations must be genuine. You can&rsquo;t recommend experiences you run yourself, and we tell guests that
        hosts earn a commission.
      </p>
      <h2>Apply</h2>
      <p>Host applications open soon.</p>
    </ProsePage>
  );
}
