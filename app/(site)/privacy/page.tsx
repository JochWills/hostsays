import type { Metadata } from "next";
import { ProsePage } from "@/components/site/prose-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy policy" placeholder>
      <p>We follow South Africa&rsquo;s Protection of Personal Information Act (POPIA). The final policy will cover:</p>
      <h2>What we collect</h2>
      <p>
        Only what we need to handle your booking: your name, email, phone number, group size, date and where you&rsquo;re
        staying.
      </p>
      <h2>Who sees it</h2>
      <ul>
        <li>The operator running your experience, so they can confirm and meet you.</li>
        <li>
          Your host, if you choose them, sees only your first name and booking details, never your email or phone number.
        </li>
        <li>Our payment provider, to process your deposit. We never see your card details.</li>
      </ul>
      <h2>Where it&rsquo;s stored</h2>
      <p>With our hosting and database providers, which may store data outside South Africa.</p>
      <h2>Your rights</h2>
      <p>You can ask to see, correct or delete your personal information.</p>
    </ProsePage>
  );
}
