import Link from "next/link";
import { CATEGORIES, type Category } from "@/lib/categories";
import { CategoryIcon } from "@/components/icons/category-icon";

/**
 * Category chips. `onPhoto` is the white version over the hero; otherwise they use the ink/green tokens.
 * `hrefFor` builds each chip's link (explore filter by default).
 */
export function CategoryChips({
  onPhoto = false,
  active,
  hrefFor = (c) => `/explore?category=${c}`,
  only,
}: {
  onPhoto?: boolean;
  active?: Category | null;
  hrefFor?: (c: Category) => string;
  /** Limit to these categories (e.g. ones with live listings). */
  only?: Category[];
}) {
  const list = only ? CATEGORIES.filter((c) => only.includes(c.value)) : CATEGORIES;
  const ring = onPhoto
    ? "border-white/75 bg-white/[.06] group-hover:bg-white group-hover:text-[#2D4A3E] group-aria-[current=true]:bg-white group-aria-[current=true]:text-[#2D4A3E]"
    : "border-line bg-surface text-green group-hover:border-green group-aria-[current=true]:border-green group-aria-[current=true]:bg-green group-aria-[current=true]:text-green-ink";

  return (
    <nav
      aria-label="Categories"
      className="-mr-(--gutter) flex flex-nowrap gap-[18px] overflow-x-auto pr-(--gutter) [scrollbar-width:none] sm:mr-0 sm:flex-wrap sm:overflow-visible sm:pr-0"
    >
      {list.map((c) => (
        <Link
          key={c.value}
          href={hrefFor(c.value)}
          aria-current={active === c.value ? "true" : undefined}
          className={`group flex flex-none items-center gap-2.5 text-[12.5px] font-medium ${onPhoto ? "text-white" : "text-ink"}`}
        >
          <span className={`grid h-[38px] w-[38px] place-items-center rounded-full border-[1.4px] transition-colors duration-200 ${ring}`}>
            <CategoryIcon category={c.value} />
          </span>
          {c.label}
        </Link>
      ))}
    </nav>
  );
}
