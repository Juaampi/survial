import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { getSession, setSession, type SessionUser } from "@/lib/session";
export { clearSession, getSession, setSession } from "@/lib/session";

export async function requireRole(role: SessionUser["role"]) {
  const session = await getSession();
  if (!session || session.role !== role) {
    redirect(role === "ADMIN" ? "/admin/login" : "/login");
  }
  return session;
}

export async function requireAnySession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;

  return {
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  } satisfies SessionUser;
}
