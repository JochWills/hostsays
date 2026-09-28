import type { Database } from "./database.types";

/** Row types for tables and views, e.g. `Row<"experiences">`, `Row<"experience_cards">`. */
export type Row<T extends keyof Database["public"]["Tables"] | keyof Database["public"]["Views"]> =
  T extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][T]["Row"]
    : T extends keyof Database["public"]["Views"]
      ? Database["public"]["Views"][T]["Row"]
      : never;

export type Enum<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
