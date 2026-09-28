import Image from "next/image";
import Link from "next/link";
import type { ExperienceCard as Card } from "@/lib/data/public";
import { ArrowRight, Clock, UsersRound } from "lucide-react";
import { formatDuration, formatRand } from "@/lib/format";
import { publicImageUrl } from "@/lib/storage";
import { PinIcon } from "@/components/icons/category-icon";
import { Stars } from "@/components/ui/stars";
import { SaveButton } from "./save-button";

const DOT_COLOURS = ["#C98B4B", "#6E8B74", "#3F6E8C"];

export function ExperienceCard({
  experience: e,
  tip,
  priority = false,
  detailed = false,
}: {
  experience: Card;
  /** A host's tip, shown on storefronts instead of the summary. */
  tip?: string;
  priority?: boolean;
  /** Explore page: larger text plus length, group size and a "View details" button. */
  detailed?: boolean;
}) {
  const dots = e.hostPhotoPaths.length ? e.hostPhotoPaths.slice(0, 3) : [];
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[10px] bg-surface shadow-card transition-transform duration-200 hover:-translate-y-0.5">
      <div className="relative aspect-[220/143] bg-[#cfc6b6]">
        {e.photo && (
          <Image
            src={publicImageUrl("experience-photos", e.photo.path)}
            alt={e.photo.alt}
            fill
            priority={priority}
            sizes="(max-width: 980px) 50vw, 25vw"
            className="object-cover"
          />
        )}
        <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-[5px] rounded-full bg-pill py-[3px] pr-[9px] pl-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
          <PinIcon />
          {e.area.name}
        </span>
        <SaveButton id={e.id} name={e.title} />
      </div>
      <div
        className={`flex flex-1 flex-col gap-0.5 ${detailed ? "px-3 pt-3 pb-3 sm:px-[18px] sm:pt-4 sm:pb-4" : "px-2.5 pt-2.5 pb-3 sm:px-[13px] sm:pt-3 sm:pb-3.5"}`}
      >
        <h3 className={`m-0 font-bold tracking-[-0.005em] ${detailed ? "text-[15px] sm:text-[17px]" : "text-[14.5px]"}`}>
          {/* Stretched link: the whole card is clickable, the heart stays a separate button. */}
          <Link href={`/x/${e.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {e.title}
          </Link>
        </h3>
        {tip ? (
          <p className="m-0 text-[13px] leading-[1.35] text-muted">
            <span className="font-semibold text-green">Our tip: </span>
            {tip}
          </p>
        ) : (
          <p className={`m-0 line-clamp-2 leading-[1.4] text-muted ${detailed ? "mt-0.5 text-[13px] sm:line-clamp-3 sm:text-[14.5px]" : "text-[13px]"}`}>
            {e.summary}
          </p>
        )}
        {e.rating != null && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-muted">
            <Stars rating={e.rating} />
            {e.rating} ({e.reviewCount})
          </div>
        )}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 ${detailed ? "mt-auto pt-3" : "mt-2.5 border-t border-line pt-2.5"}`}
        >
          {e.hostCount > 0 ? (
            <span
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold whitespace-nowrap text-green"
              title={`Recommended by ${e.hostCount} local ${e.hostCount === 1 ? "host" : "hosts"}`}
            >
              <span className="flex" aria-hidden="true">
                {(dots.length ? dots : DOT_COLOURS.slice(0, Math.min(3, e.hostCount))).map((d, i) => (
                  <span
                    key={d}
                    className={`relative block h-4 w-4 overflow-hidden rounded-full border-2 border-surface ${i ? "-ml-[5px]" : ""}`}
                    style={dots.length ? undefined : { background: d }}
                  >
                    {dots.length > 0 && (
                      <Image src={publicImageUrl("host-photos", d)} alt="" fill sizes="16px" className="object-cover" />
                    )}
                  </span>
                ))}
              </span>
              {e.hostCount} {e.hostCount === 1 ? "host" : "hosts"}
            </span>
          ) : (
            <span />
          )}
          <span className={`font-bold whitespace-nowrap text-ink ${detailed ? "text-[14px] sm:text-[15.5px]" : "text-[13px]"}`}>
            {formatRand(e.priceCents)}{" "}
            <small className="text-[11.5px] font-medium text-muted">{e.isGroupPrice ? "per group" : "pp"}</small>
          </span>
        </div>
        {detailed && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-[12.5px] text-muted sm:text-[13px]">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={15} strokeWidth={1.8} aria-hidden="true" />
              {formatDuration(e.durationMinutes)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UsersRound size={15} strokeWidth={1.8} aria-hidden="true" />
              {e.minPeople > 1 ? `Min ${e.minPeople}` : `Up to ${e.maxPeople}`}
            </span>
            {/* Visual only: the whole card is the link. */}
            <span
              aria-hidden="true"
              className="ml-auto hidden items-center gap-2 rounded-full border border-line px-4 py-2 text-[13.5px] font-semibold text-ink group-hover:border-green sm:inline-flex"
            >
              View details <ArrowRight size={15} />
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

export function ExperienceGrid({
  experiences,
  priorityCount = 0,
  detailed = false,
  className = "grid-cols-2 md:grid-cols-4",
}: {
  experiences: Card[];
  priorityCount?: number;
  detailed?: boolean;
  className?: string;
}) {
  return (
    <div className={`grid gap-2.5 sm:gap-3 ${className}`}>
      {experiences.map((e, i) => (
        <ExperienceCard key={e.id} experience={e} priority={i < priorityCount} detailed={detailed} />
      ))}
    </div>
  );
}
