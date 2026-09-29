/**
 * What a saved "which area?" choice means for the database (see lib/area-options.ts):
 * - an area id: move them there and drop any town request;
 * - "other:<province id>" + town: no area yet, the request waits for an admin;
 * - "": leave everything as it is.
 */
export function areaChoiceColumns(areaId: string, town: string) {
  if (!areaId) return null;
  if (areaId.startsWith("other:")) {
    return { area: { area_id: null }, request: { requested_province_id: areaId.slice(6), requested_town: town } };
  }
  return { area: { area_id: areaId }, request: { requested_province_id: null, requested_town: null } };
}
