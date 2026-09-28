import Image from "next/image";
import Link from "next/link";
import type { HostCard as Card } from "@/lib/data/public";
import { publicImageUrl } from "@/lib/storage";
import { PinIcon } from "@/components/icons/category-icon";
import { SaveButton } from "./save-button";

export function HostCard({ host: h }: { host: Card }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[10px] bg-surface shadow-card transition-transform duration-200 hover:-translate-y-0.5">
      <div className="relative aspect-[220/143] bg-[#cfc6b6]">
        {h.photoPath && (
          <Image
            src={publicImageUrl("host-photos", h.photoPath)}
            alt={h.name}
            fill
            sizes="(max-width: 980px) 50vw, 25vw"
            className="object-cover"
          />
        )}
        {h.area && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-[5px] rounded-full bg-pill py-[3px] pr-[9px] pl-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <PinIcon />
            {h.area.name}
          </span>
        )}
        <SaveButton id={h.id} name={h.name} />
      </div>
      <div className="flex flex-1 flex-col px-2.5 pt-3 pb-3.5 sm:px-[13px] sm:pt-3.5 sm:pb-4">
        <h3 className="m-0 text-[15px] font-bold tracking-[-0.005em]">
          <Link href={`/${h.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {h.name}
          </Link>
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 text-[12.5px] text-muted">
          <span>
            {h.pickCount} {h.pickCount === 1 ? "pick" : "picks"}
          </span>
          <span className="font-semibold text-green">Their picks →</span>
        </div>
      </div>
    </article>
  );
}

export function HostGrid({ hosts }: { hosts: Card[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
      {hosts.map((h) => (
        <HostCard key={h.id} host={h} />
      ))}
    </div>
  );
}
