import { ConfirmButton } from "./form";
import { btnSecondary, panel, sectionTitle } from "@/components/ui/styles";

/** Admin pages: a clearly separate "Delete" box that asks before deleting. */
export function DeleteZone({
  action,
  id,
  title,
  body,
  confirm,
  label,
}: {
  action: (form: FormData) => Promise<void>;
  id: string;
  title: string;
  body: React.ReactNode;
  confirm: string;
  label: string;
}) {
  return (
    <section className={`${panel} mb-6 border border-danger/30`}>
      <h2 className={`${sectionTitle} text-danger`}>{title}</h2>
      <p className="mt-1 mb-4 text-[14px] text-muted">{body}</p>
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <ConfirmButton message={confirm} className={`${btnSecondary} !border-danger/40 !text-danger hover:!border-danger`}>
          {label}
        </ConfirmButton>
      </form>
    </section>
  );
}
