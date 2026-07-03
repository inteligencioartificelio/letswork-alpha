import "server-only";
import { cookies } from "next/headers";
import * as jose from "jose";
import { eq } from "drizzle-orm";
import { getDB } from "@/lib/db";
import { users } from "@/db/schema";
import type { User } from "@/db/schema";

const JWT_SECRET =
  process.env.JWT_SECRET || "dev-secret-letswork-alpha-change-in-production-9182734";
const key = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = "session_token";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export async function signSession(user: User): Promise<string> {
  return await new jose.SignJWT({ id: user.id, username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key);
}

export async function setSessionCookie(user: User): Promise<void> {
  const token = await signSession(user);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jose.jwtVerify(token, key, { algorithms: ["HS256"] });
    if (!payload || !payload.id) return null;

    const db = await getDB();
    const [user] = await db.select().from(users).where(eq(users.id, String(payload.id)));
    return user ?? null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
