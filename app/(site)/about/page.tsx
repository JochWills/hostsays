import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/site/prose-page";

export const metadata: Metadata = {
  title: "About HostSays",
  description: "Things to do, recommended by the local hosts who know the area best.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ProsePage
      title={
        <>
          Advice from a good host, <em className="font-serif font-semibold">over breakfast.</em>
        </>
      }
      intro="HostSays is where travellers find and book experiences that local hosts actually recommend."
    >
      <p>
        Hosts recommend things to do every day. Which game drive is worth it, when the sea is calm enough to snorkel,
        where to watch the sun go down. HostSays puts those recommendations in one place and
        makes them easy to book.
      </p>
      <h2>How we&rsquo;re different</h2>
      <ul>
        <li>Every experience shows how many verified local hosts recommend it, with their tips.</li>
        <li>You request first and pay a small deposit only once the operator confirms.</li>
        <li>Small local operators get bookings without big upfront costs.</li>
      </ul>
      <h2>Honest about how we earn</h2>
      <p>
        Hosts earn a commission when you book through them. It doesn&rsquo;t change your price. Recommendations must be
        genuine, and hosts can&rsquo;t recommend experiences they run themselves.
      </p>
      <p>
        HostSays is a booking intermediary. The experiences are run by independent operators, who are responsible for the
        activity itself. See our <Link href="/terms">terms</Link>.
      </p>
      <h2>Where we are</h2>
      <p>
        We&rsquo;re launching in South Africa and adding new places as local hosts and operators join, with more
        countries to follow. <Link href="/areas">See the areas we cover</Link>.
      </p>
    </ProsePage>
  );
}
