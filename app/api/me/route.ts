import { NextResponse } from "next/server";
import { getCurrentUser, homeForRole, settingsForRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Who's signed in, for the header's profile menu (public pages stay static, so they ask after loading). */
export async function GET() {
  const user = await getCurrentUser();
  const body = user?.role
    ? {
        signedIn: true,
        name: user.fullName ?? user.email,
        email: user.email,
        role: user.role,
        home: homeForRole(user.role),
        settings: settingsForRole(user.role),
      }
    : { signedIn: false };
  return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
}
