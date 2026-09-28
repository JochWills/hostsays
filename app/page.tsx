import Link from "next/link";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { HeroSearch } from "@/components/home/hero-search";
import { CategoryChips } from "@/components/home/category-chips";
import { HostPromo, OperatorPromo } from "@/components/home/promos";
import { HowSteps } from "@/components/home/how-steps";
import { ExperienceGrid } from "@/components/cards/experience-card";
import { HostGrid } from "@/components/cards/host-card";
import { SectionHead } from "@/components/ui/section-head";
import { provinceInSentence } from "@/lib/format";
import { getFeaturedExperiences, getHostCards, getLiveAreas, getProvinces } from "@/lib/data/public";
import { minBookableDate } from "@/lib/dates";

// Rebuild at most every 5 minutes; admin edits show up within that time.
export const revalidate = 300;

export default async function Home() {
  const [experiences, hosts, areas, provinces] = await Promise.all([
    getFeaturedExperiences(4),
    getHostCards({ featuredFirst: true, limit: 4 }),
    getLiveAreas(),
    getProvinces(),
  ]);
  // "Where are you going?": anywhere, then each province with its live towns.
  const places = [
    { value: "", label: "Anywhere" },
    ...provinces.flatMap((p) => [
      { value: p.slug, label: `All of ${provinceInSentence(p.name)}`, group: p.name },
      ...p.areas.map((a) => ({ value: a.slug, label: a.name, group: p.name })),
    ]),
  ];

  return (
    <>
      <header className="relative overflow-hidden bg-hero bg-[url(/images/hero.jpg)] bg-cover bg-position-[78%_center] bg-no-repeat text-white md:bg-position-[right_center]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.35)_0%,rgba(0,0,0,.15)_40%,rgba(0,0,0,0)_60%),linear-gradient(180deg,rgba(0,0,0,.28)_0%,rgba(0,0,0,0)_22%,rgba(0,0,0,0)_70%,rgba(0,0,0,.28)_100%)]"
        />
        <div className="wrap relative">
          <Header variant="overlay" />
          <div className="max-w-[720px] pt-10 sm:pt-[62px]">
            <h1 className="m-0 text-[clamp(34px,4.6vw,56px)] leading-[1.05] font-extrabold tracking-[-0.025em] [text-shadow:0_2px_20px_rgba(0,0,0,.25)]">
              Things to do,
              <br />
              <em className="font-serif font-semibold tracking-[-0.01em]">recommended by local hosts.</em>
            </h1>
            <p className="mt-[18px] max-w-[560px] text-[clamp(15px,1.35vw,18.5px)] leading-[1.45] opacity-95">
              Book the best safaris, ocean trips and local adventures on the Eastern Cape coast, picked by the
              guesthouses and hosts you stay with.
            </p>
          </div>
          <HeroSearch places={places} minDate={minBookableDate()} />
          <div className="mt-[22px] pb-[26px] sm:pb-8">
            <CategoryChips onPhoto />
          </div>
        </div>
      </header>

      <main className="wrap flex-1">
        <div className="relative grid grid-cols-1 gap-[22px] pt-[26px] lg:grid-cols-[minmax(0,1fr)_385px]">
          <div>
            <section aria-labelledby="h-exp" className="mb-7">
              <SectionHead id="h-exp" title="Most recommended by hosts" href="/explore" />
              {experiences.length ? (
                <ExperienceGrid experiences={experiences} priorityCount={4} />
              ) : (
                <p className="py-5 text-muted">Experiences are on their way. Check back soon.</p>
              )}
            </section>
            {hosts.length > 0 && (
              <section aria-labelledby="h-hosts" className="mb-7">
                <SectionHead id="h-hosts" title="Hosts who know the area" href="/hosts" />
                <HostGrid hosts={hosts} />
              </section>
            )}
          </div>

          <aside className="relative flex flex-col gap-[22px] md:flex-row lg:flex-col">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 -right-(--gutter) -bottom-10 hidden w-[170px] bg-[url(/images/coast.jpg)] bg-cover bg-center opacity-95 [mask-image:linear-gradient(90deg,transparent,#000_45%)] lg:block"
            />
            <HostPromo />
            <OperatorPromo />
          </aside>
        </div>

        <HowSteps />

        {areas.length > 0 && (
          <p id="areas" className="mx-0.5 mt-[18px] text-[13px] text-muted">
            Now live along the Eastern Cape coast:{" "}
            {areas.map((a, i) => (
              <span key={a.slug}>
                <Link href={`/${a.slug}`} className="hover:text-green hover:underline">
                  {a.name}
                </Link>
                {i < areas.length - 2 ? ", " : i === areas.length - 2 ? " and " : ""}
              </span>
            ))}
            . Hosts earn a commission when you book through them.
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
