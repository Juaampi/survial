import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { loginAdminAction } from "@/lib/actions";

export default function AdminLoginPage() {
  return (
    <main className="auth-shell auth-shell--admin">
      <div className="auth-card">
        <AuthForm
          action={loginAdminAction}
          title="Panel administrativo"
          description="Gestioná cursos, alumnos, materiales y cuestionarios desde un solo lugar."
          submitLabel="Entrar al admin"
        />
        <p className="auth-card__hint">
          <Link href="/">Volver a la portada</Link>
        </p>
      </div>
    </main>
  );
}
