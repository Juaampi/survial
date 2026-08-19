import Link from "next/link";

import { requireRole } from "@/lib/auth";
import { getStudentDashboard } from "@/lib/queries";
import { formatPercent } from "@/lib/utils";

export default async function CampusPage() {
  const session = await requireRole("STUDENT");
  const user = await getStudentDashboard(session.userId);

  if (!user) return null;

  return (
    <main className="dashboard-content">
      <section className="dashboard-hero dashboard-hero--student">
        <div>
          <p className="eyebrow">Resumen</p>
          <h1>Hola, {user.name}</h1>
          <p>Revisá tu avance, retomá tus cursos y encontrá rápido cada clase y evaluación.</p>
        </div>
      </section>

      <section className="admin-stats admin-stats--student">
        <article className="panel-card">
          <span className="panel-kicker">Cursos activos</span>
          <strong>{user.enrollments.length}</strong>
        </article>
        <article className="panel-card">
          <span className="panel-kicker">Progreso promedio</span>
          <strong>
            {user.enrollments.length === 0
              ? "0%"
              : formatPercent(
                  Math.round(
                    user.enrollments.reduce((acc, enrollment) => acc + enrollment.progressPercent, 0) /
                      user.enrollments.length,
                  ),
                )}
          </strong>
        </article>
        <article className="panel-card">
          <span className="panel-kicker">Evaluaciones</span>
          <strong>{user.enrollments.reduce((acc, enrollment) => acc + enrollment.quizAttempts.length, 0)}</strong>
        </article>
      </section>

      <section className="student-dashboard-layout">
        <article className="panel-card student-focus-card">
          <div className="panel-form__header">
            <h2>Tu espacio de estudio</h2>
            <p>
              Entrá a cada curso para ver módulos, materiales, videos y cuestionarios en un orden
              claro.
            </p>
          </div>
          <div className="student-checklist">
            <div>
              <strong>1. Revisá tu curso</strong>
              <span>Entrá a la ficha y recorré las clases por módulo.</span>
            </div>
            <div>
              <strong>2. Marcá avances</strong>
              <span>Podés ir registrando qué clases ya completaste.</span>
            </div>
            <div>
              <strong>3. Resolvé evaluaciones</strong>
              <span>Completá los cuestionarios cuando llegues al cierre de cada tema.</span>
            </div>
          </div>
        </article>

        <div className="dashboard-grid">
        {user.enrollments.length === 0 ? (
          <article className="panel-card">
            <h2>Todavía no tenés cursos asignados</h2>
            <p>Cuando SurVial te inscriba, van a aparecer acá automáticamente.</p>
          </article>
        ) : (
          user.enrollments.map((enrollment) => (
            <article className="panel-card course-overview-card" key={enrollment.id}>
              <div className="course-overview-card__head">
                <div>
                  <span className="panel-kicker">{enrollment.status}</span>
                  <h2>{enrollment.course.title}</h2>
                </div>
                <strong>{formatPercent(enrollment.progressPercent)}</strong>
              </div>

              <p>{enrollment.course.summary}</p>
              <div className="progress-track">
                <span style={{ width: `${enrollment.progressPercent}%` }} />
              </div>

              <ul className="content-list">
                <li>{enrollment.course.modules.length} módulos</li>
                <li>
                  {enrollment.course.modules.reduce((acc, module) => acc + module.lessons.length, 0)} clases
                </li>
                <li>{enrollment.quizAttempts.length} intentos de cuestionario</li>
              </ul>

              <Link className="button button--primary" href={`/campus/curso/${enrollment.course.slug}`}>
                Ver curso
              </Link>
            </article>
          ))
        )}
        </div>
      </section>
    </main>
  );
}
