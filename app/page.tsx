import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";

// Phase 0 placeholder. Phase 2 rebuilds this to match reference/homepage-prototype.html.
export default function Home() {
  return (
    <>
      <header
        className="relative min-h-[470px] overflow-hidden bg-hero bg-[url(/images/hero.jpg)] bg-size-[auto_100%] bg-position-[70%_30%] bg-no-repeat text-white md:bg-right"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,#2c1f11_0%,rgba(44,31,17,.85)_32%,rgba(44,31,17,.45)_50%,rgba(44,31,17,.1)_66%,rgba(0,0,0,0)_80%),linear-gradient(180deg,rgba(0,0,0,.28)_0%,rgba(0,0,0,0)_22%,rgba(0,0,0,0)_70%,rgba(0,0,0,.28)_100%)]"
        />
        <div className="wrap-hero relative">
          <Header variant="overlay" />
          <div className="max-w-[720px] pt-10 pb-12 sm:pt-[62px]">
            <h1 className="m-0 text-[clamp(34px,4.6vw,56px)] leading-[1.05] font-extrabold tracking-[-0.025em] [text-shadow:0_2px_20px_rgba(0,0,0,.25)]">
              Things to do,
              <br />
              <em className="font-serif font-semibold tracking-[-0.01em]">recommended by local hosts.</em>
            </h1>
            <p className="mt-[18px] max-w-[560px] text-[clamp(15px,1.35vw,18.5px)] leading-[1.45] opacity-95">
              Book the best safaris, ocean trips and local adventures on the Eastern Cape coast, picked by
              the guesthouses and hosts you stay with.
            </p>
          </div>
        </div>
      </header>
      <main className="wrap flex-1 pt-8">
        <p className="text-muted">We&rsquo;re setting things up. Experiences and hosts will appear here soon.</p>
      </main>
      <Footer />
    </>
  );
}
