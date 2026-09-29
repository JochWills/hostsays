import { provinceInSentence } from "@/lib/format";

export type AreaChoiceProvince = { id: string; name: string; areas: { id: string; name: string }[] };

/**
 * Options for "which area are you in?" dropdowns, grouped by province. With `somewhereElse`, each province
 * ends with "Somewhere else in …" (value "other:<province id>"), so anyone in South Africa can sign up and
 * type their town; an admin then adds or assigns the area.
 */
export function areaOptions(provinces: AreaChoiceProvince[], { somewhereElse = false } = {}) {
  return provinces.flatMap((p) => [
    ...p.areas.map((a) => ({ value: a.id, label: a.name, group: p.name })),
    ...(somewhereElse
      ? [{ value: `other:${p.id}`, label: `${p.areas.length ? "Somewhere else" : "Somewhere"} in ${provinceInSentence(p.name)}`, group: p.name }]
      : []),
  ]);
}

export const isSomewhereElse = (value: string | null | undefined) => Boolean(value?.startsWith("other:"));
