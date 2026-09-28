import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { sectionTitle } from "./styles";

export function SectionHead({
  id,
  title,
  href,
  linkLabel = "View all",
}: {
  id?: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mt-1 mb-3 flex items-baseline justify-between gap-4">
      <h2 id={id} className={`m-0 ${sectionTitle}`}>
        {title}
      </h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-2 text-[13.5px] font-medium whitespace-nowrap hover:text-green">
          {linkLabel} <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
