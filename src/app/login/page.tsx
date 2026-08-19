import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { loginStudentAction } from "@/lib/actions";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <AuthForm
          action={loginStudentAction}
          title="Ingreso de alumnos"
          description="Entrá a tu panel para ver cursos, materiales, progreso y evaluaciones."
          submitLabel="Entrar al campus"
        />
        <p className="auth-card__hint">
          ¿Sos de SurVial? <Link href="/admin/login">Ir al panel administrativo</Link>
        </p>
      </div>
    </main>
  );
}
