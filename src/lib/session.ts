import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "survial_session";
const SESSION_MAX_AGE = 60 * 60 * 12;

export type SessionUser = {
  userId: string;
  role: "ADMIN" | "STUDENT";
  email: string;
  name: string;
};

function getSessionSecret() {
  const fallback = `${process.env.ADMIN_EMAIL ?? "admin"}:${process.env.ADMIN_PASSWORD ?? "password"}`;
  return new TextEncoder().encode(process.env.SESSION_SECRET || fallback);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function setSession(user: SessionUser) {
  const cookieStore = await cookies();
  const token = await createSessionToken(user);

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}
