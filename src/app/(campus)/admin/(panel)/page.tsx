import Link from "next/link";

import { getAdminDashboardData } from "@/lib/queries";
import { getStorageLabel } from "@/lib/storage";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardData();

  return (
    <main className="dashboard-content">
      <section className="dashboard-hero dashboard-hero--compact">
        <div>
          <p className="eyebrow">Inicio</p>
          <h1>Gestión académica centralizada</h1>
          <p>Todo el campus, ordenado por áreas para que sea más fácil de administrar.</p>
        </div>
      </section>

      <section className="admin-stats">
        <article className="panel-card">
          <span className="panel-kicker">Alumnos</span>
          <strong>{stats.students}</strong>
        </article>
        <article className="panel-card">
          <span className="panel-kicker">Cursos</span>
          <strong>{stats.courses}</strong>
        </article>
        <article className="panel-card">
          <span className="panel-kicker">Inscripciones</span>
          <strong>{stats.enrollments}</strong>
        </article>
        <article className="panel-card">
          <span className="panel-kicker">Storage</span>
          <strong>{getStorageLabel()}</strong>
        </article>
        <article className="panel-card">
          <span className="panel-kicker">Clases</span>
          <strong>{stats.lessons}</strong>
        </article>
        <article className="panel-card">
          <span className="panel-kicker">Materiales</span>
          <strong>{stats.materials}</strong>
        </article>
      </section>

      <section className="admin-links">
        <Link className="panel-card panel-card--link" href="/admin/cursos">
          <h2>Cursos</h2>
          <p>Gestioná la base de cursos y sus módulos principales.</p>
        </Link>
        <Link className="panel-card panel-card--link" href="/admin/alumnos">
          <h2>Alumnos</h2>
          <p>Alta de usuarios, asignación de credenciales e inscripción manual.</p>
        </Link>
        <Link className="panel-card panel-card--link" href="/admin/contenidos">
          <h2>Contenidos</h2>
          <p>Creá clases, cuestionarios y organizá el recorrido de cada curso.</p>
        </Link>
        <Link className="panel-card panel-card--link" href="/admin/materiales">
          <h2>Materiales</h2>
          <p>Revisá todos los PDFs, archivos y recursos ya cargados en el campus.</p>
        </Link>
      </section>
    </main>
  );
}
