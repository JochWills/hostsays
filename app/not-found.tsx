import Link from "next/link";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="wrap flex-1 py-16">
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">We couldn&rsquo;t find that page</h1>
        <p className="mt-2 text-muted">It may have moved, or the link has a typo.</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-[14px] bg-green px-[26px] py-[13px] font-semibold text-green-ink hover:brightness-110"
        >
          Back to home
        </Link>
      </main>
      <Footer />
    </>
  );
}
