import { pageTitle } from "@/components/ui/styles";

/** Simple text page: title, optional intro, readable body. */
export function ProsePage({
  title,
  intro,
  placeholder = false,
  children,
}: {
  title: React.ReactNode;
  intro?: React.ReactNode;
  /** Legal pages: flag that the text is not final. */
  placeholder?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="wrap pt-8">
      <div className="max-w-[720px]">
        <h1 className={pageTitle}>{title}</h1>
        {intro && <p className="mt-3 text-[17px] leading-[1.55] text-muted">{intro}</p>}
        {placeholder && (
          <p className="mt-5 rounded-[10px] border border-gold/50 bg-gold/10 px-4 py-3 text-[14px]">
            Placeholder text for development. The final version will be published before bookings open.
          </p>
        )}
        <div className="prose-hs mt-6">{children}</div>
      </div>
    </div>
  );
}
