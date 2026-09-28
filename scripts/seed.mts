/**
 * Demo data for development: areas, operators, experiences, hosts, recommendations, photos and the admin user.
 * Safe to re-run (upserts on fixed ids). Run with `npm run db:seed`.
 *
 * Uses the service role, so it bypasses RLS. Never point this at production once real data exists.
 * All contact emails are @example.com so seed data can never email a real business.
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
if (!url || !serviceKey) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");

const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const ASSETS = new URL("../reference/assets/", import.meta.url);

// Fixed ids keep the seed idempotent and make rows easy to spot.
const id = (group: string, n: number) => `5eed0000-0000-4000-8000-${group}${String(n).padStart(12 - group.length, "0")}`;

const AREA = {
  gqeberha: id("a", 1),
  addo: id("a", 2),
  jbay: id("a", 3),
  stfrancis: id("a", 4),
  kenton: id("a", 5),
  portalfred: id("a", 6),
};
const OP = { schotia: id("b", 1), prodive: id("b", 2), trails: id("b", 3), sundowners: id("b", 4) };
const EXP = { safari: id("c", 1), seals: id("c", 2), horses: id("c", 3), wine: id("c", 4) };
const HOST = { sundays: id("d", 1), kenton: id("d", 2), onthebay: id("d", 3), aloe: id("d", 4) };

const areas = [
  { id: AREA.gqeberha, slug: "gqeberha", name: "Gqeberha", sort_order: 1, is_live: true,
    intro: "Ask any host in Summerstrand and they'll say the same thing: get on the water. Algoa Bay is right on the doorstep." },
  { id: AREA.addo, slug: "addo", name: "Addo", sort_order: 2, is_live: true,
    intro: "Elephant country. Hosts around Addo and the Sundays River Valley know which drives and trails are worth your morning." },
  { id: AREA.jbay, slug: "jeffreys-bay", name: "Jeffreys Bay", sort_order: 3, is_live: false,
    intro: "Surf town with a slow pace. Local hosts share where to go when you're not in the water." },
  { id: AREA.stfrancis, slug: "st-francis-bay", name: "St Francis Bay", sort_order: 4, is_live: false,
    intro: "Canals, beaches and quiet coastal walks, picked by the people who live here." },
  { id: AREA.kenton, slug: "kenton-on-sea", name: "Kenton-on-Sea", sort_order: 5, is_live: true,
    intro: "Between two rivers and the sea. Hosts in Kenton know the best spots for a long, lazy afternoon." },
  { id: AREA.portalfred, slug: "port-alfred", name: "Port Alfred", sort_order: 6, is_live: false,
    intro: "A river town on the Sunshine Coast, with local favourites on the Kowie and along the beach." },
];

const operators = [
  { id: OP.schotia, slug: "schotia-safaris", name: "Schotia Safaris", area_id: AREA.addo },
  { id: OP.prodive, slug: "pro-dive", name: "Pro Dive", area_id: AREA.gqeberha },
  // No operator was named in the prototype for these two. Placeholder names until the real operators sign up.
  { id: OP.trails, slug: "addo-trail-rides", name: "Addo Trail Rides", area_id: AREA.addo },
  { id: OP.sundowners, slug: "kenton-farm-sundowners", name: "Kenton Farm Sundowners", area_id: AREA.kenton },
].map((o) => ({ ...o, description: null, status: "verified", is_demo: true }));

const operatorPrivate = operators.map((o) => ({
  operator_id: o.id,
  contact_email: `${o.slug}@example.com`,
  terms_accepted_at: new Date().toISOString(),
  created_by_admin: true,
}));

const experiences = [
  {
    id: EXP.safari, operator_id: OP.schotia, slug: "schotia-big-five-safari", title: "Schotia Big Five Safari",
    summary: "Afternoon game drive with lions, elephants and a bush dinner", category: "safari", area_id: AREA.addo,
    duration_minutes: 360, price_cents: 295000, min_people: 1, max_people: 10, featured_rank: 1,
    included: ["Open-vehicle game drive", "Guide", "Bush dinner"], what_to_bring: ["Warm jacket", "Binoculars", "Camera"],
    meeting_point: "Reserve reception, Addo", photo: "lion.jpg", alt: "Lion resting in golden grass at sunset",
    slots: [{ days: [0, 1, 2, 3, 4, 5, 6], time: "14:00", capacity: 20 }],
  },
  {
    id: EXP.seals, operator_id: OP.prodive, slug: "pro-dive-seal-snorkel", title: "Pro Dive Seal Snorkel",
    summary: "Float alongside playful Cape fur seals in Algoa Bay", category: "ocean", area_id: AREA.gqeberha,
    duration_minutes: 180, price_cents: 115000, min_people: 1, max_people: 8, featured_rank: 2,
    included: ["Boat trip", "Wetsuit, mask and snorkel", "Guide"], what_to_bring: ["Swimsuit", "Towel", "Sunscreen"],
    meeting_point: "Harbour slipway, Gqeberha", photo: "seal.jpg", alt: "Cape fur seal swimming underwater",
    slots: [{ days: [0, 1, 2, 3, 4, 5, 6], time: "08:00", capacity: 12 }, { days: [0, 5, 6], time: "11:00", capacity: 12 }],
  },
  {
    id: EXP.horses, operator_id: OP.trails, slug: "horseback-bush-trail", title: "Horseback Bush Trail",
    summary: "Ride through valley bushveld at golden hour", category: "adventure", area_id: AREA.addo,
    duration_minutes: 120, price_cents: 85000, min_people: 1, max_people: 6, featured_rank: 3,
    included: ["Horse and tack", "Helmet", "Guide"], what_to_bring: ["Closed shoes", "Long trousers", "Water"],
    meeting_point: "Stables, Sundays River Valley", photo: "horse.jpg", alt: "Riders on horseback in the bush at golden hour",
    slots: [{ days: [2, 3, 4, 5, 6, 0], time: "16:00", capacity: 8 }],
  },
  {
    id: EXP.wine, operator_id: OP.sundowners, slug: "wine-and-cheese-sundowner", title: "Wine & Cheese Sundowner",
    summary: "Tasting on a farm stoep as the sun goes down", category: "food", area_id: AREA.kenton,
    duration_minutes: 120, price_cents: 49500, min_people: 2, max_people: 12, featured_rank: 4,
    included: ["Wine tasting", "Cheese board"], what_to_bring: ["A light jacket for after sunset"],
    meeting_point: "Farm stall, outside Kenton-on-Sea", photo: "wine.jpg", alt: "Glasses of wine and a cheese board on a stoep",
    slots: [{ days: [3, 4, 5, 6, 0], time: "17:00", capacity: 16 }],
  },
];

const hosts = [
  { id: HOST.sundays, slug: "sundaysriver", name: "Sundays River Retreat", type: "lodge", area_id: AREA.addo, photo: "gh1.jpg", featured_rank: 1,
    welcome_note: "We've lived in the valley for years. These are the trips we send our own friends on." },
  { id: HOST.kenton, slug: "kentoncliff", name: "Kenton Cliff House", type: "self_catering", area_id: AREA.kenton, photo: "gh2.jpg", featured_rank: 2,
    welcome_note: "Slow mornings, long afternoons. Here's what we'd do if we were on holiday here." },
  { id: HOST.onthebay, slug: "onthebay", name: "On The Bay B&B", type: "bnb", area_id: AREA.gqeberha, photo: "gh3.jpg", featured_rank: 3,
    welcome_note: "Welcome! Our guests always ask what to do, so here are our favourites around the bay." },
  { id: HOST.aloe, slug: "aloefarmstead", name: "Aloe Farmstead", type: "guesthouse", area_id: AREA.jbay, photo: "gh4.jpg", featured_rank: 4,
    welcome_note: "When the surf's flat, these are the trips our guests come back raving about." },
];

const recommendations: [string, string, string][] = [
  [HOST.sundays, EXP.safari, "Book the afternoon drive. The light is beautiful and you'll be back in time for a late dinner."],
  [HOST.sundays, EXP.horses, "Perfect for a first ride. The guides go at your pace and the valley glows at sunset."],
  [HOST.onthebay, EXP.seals, "Go on the early trip when the bay is calm. Bring a warm top for the boat ride back."],
  [HOST.onthebay, EXP.safari, "Worth the drive out to Addo. Leave after lunch and make a day of it."],
  [HOST.kenton, EXP.wine, "Our favourite way to end a beach day. Take a jacket, it cools down fast after sunset."],
  [HOST.kenton, EXP.seals, "If you're heading to Gqeberha, do this. Our guests say it's the highlight of their trip."],
  [HOST.aloe, EXP.seals, "An easy day trip from JBay. The seals are curious and come right up to you."],
  [HOST.aloe, EXP.horses, "A lovely change of scene from the coast. Great for families with older kids."],
];

async function upload(bucket: string, path: string, file: string) {
  const body = await readFile(new URL(file, ASSETS));
  const { error } = await db.storage.from(bucket).upload(path, body, { contentType: "image/jpeg", upsert: true });
  if (error) throw new Error(`Upload ${bucket}/${path}: ${error.message}`);
  return path;
}

async function upsert(table: string, rows: object[], onConflict = "id") {
  const { error } = await db.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ${table}: ${rows.length}`);
}

async function seedAdmin() {
  if (!adminEmail) {
    console.log("  admin: skipped (set ADMIN_EMAIL in .env.local)");
    return;
  }
  const { data: list, error: listError } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  let user = list.users.find((u) => u.email?.toLowerCase() === adminEmail.toLowerCase());
  if (!user) {
    // No password: sign in by magic link once auth is built (Phase 5). No email is sent now.
    const { data, error } = await db.auth.admin.createUser({ email: adminEmail, email_confirm: true });
    if (error) throw error;
    user = data.user;
  }
  await upsert("profiles", [{ id: user.id, role: "admin", full_name: "Josh" }]);
  console.log(`  admin: ${adminEmail}`);
}

async function main() {
  console.log(`Seeding ${url}`);

  await upsert("areas", areas);
  await upsert("operators", operators);
  await upsert("operator_private", operatorPrivate, "operator_id");

  await upsert(
    "experiences",
    experiences.map(({ photo, alt, slots, ...e }) => ({
      ...e,
      // The page shows its own "demo listing" note for is_demo operators.
      description: `${e.summary}.`,
      operator_cancellation_terms: null,
      status: "live",
    })),
  );

  const photos = [];
  const slots = [];
  for (const e of experiences) {
    const path = await upload("experience-photos", `${e.id}/1.jpg`, e.photo);
    photos.push({ id: id("e", photos.length + 1), experience_id: e.id, path, alt: e.alt, sort_order: 0 });
    for (const s of e.slots) {
      for (const weekday of s.days) {
        slots.push({ experience_id: e.id, weekday, start_time: s.time, capacity: s.capacity });
      }
    }
  }
  await upsert("experience_photos", photos);
  await upsert("experience_slots", slots, "experience_id,weekday,start_time");

  const hostRows = [];
  for (const { photo, ...h } of hosts) {
    const photo_path = await upload("host-photos", `${h.id}/photo.jpg`, photo);
    hostRows.push({ ...h, photo_path, status: "verified", verified_at: new Date().toISOString() });
  }
  await upsert("hosts", hostRows);
  await upsert(
    "host_private",
    hosts.map((h) => ({
      host_id: h.id,
      listing_url: `https://example.com/${h.slug}`,
      contact_email: `${h.slug}@example.com`,
      commission_rate: 0.06,
    })),
    "host_id",
  );

  await upsert(
    "recommendations",
    recommendations.map(([host_id, experience_id, tip], i) => ({ host_id, experience_id, tip, sort_order: i })),
    "host_id,experience_id",
  );

  await seedAdmin();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
