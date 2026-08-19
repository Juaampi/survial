import { DashboardNav } from "@/components/dashboard-nav";
import { LogoutButton } from "@/components/logout-button";
import { requireRole } from "@/lib/auth";

const adminItems = [
  {
    href: "/admin",
    label: "Inicio",
    description: "Resumen general del campus",
  },
  {
    href: "/admin/alumnos",
    label: "Alumnos",
    description: "Usuarios, accesos e inscripciones",
  },
  {
    href: "/admin/cursos",
    label: "Cursos",
    description: "Cursos y módulos principales",
  },
  {
    href: "/admin/contenidos",
    label: "Contenidos",
    description: "Clases, cuestionarios y estructura",
  },
  {
    href: "/admin/materiales",
    label: "Materiales",
    description: "Archivos y recursos cargados",
  },
];

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  await requireRole("ADMIN");

  return (
    <div className="dashboard-frame">
      <DashboardNav
        title="Administración"
        subtitle="Navegación clara para gestionar el campus por áreas."
        items={adminItems}
      />

      <div className="dashboard-main">
        <div className="dashboard-main__topbar">
          <div>
            <span className="panel-kicker">Panel SurVial</span>
            <h1>Gestión académica</h1>
          </div>
          <LogoutButton />
        </div>
        {children}
      </div>
    </div>
  );
}
