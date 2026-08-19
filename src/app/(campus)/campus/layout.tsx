import { DashboardNav } from "@/components/dashboard-nav";
import { LogoutButton } from "@/components/logout-button";
import { requireRole } from "@/lib/auth";

const studentItems = [
  {
    href: "/campus",
    label: "Resumen",
    description: "Vista general de tu cursado",
  },
];

export default async function CampusLayout({ children }: LayoutProps<"/campus">) {
  await requireRole("STUDENT");

  return (
    <div className="dashboard-frame dashboard-frame--student">
      <DashboardNav
        title="Campus del alumno"
        subtitle="Tu espacio para seguir cursos, materiales y evaluaciones."
        items={studentItems}
      />

      <div className="dashboard-main">
        <div className="dashboard-main__topbar">
          <div>
            <span className="panel-kicker">Campus SurVial</span>
            <h1>Tu aprendizaje</h1>
          </div>
          <LogoutButton />
        </div>
        {children}
      </div>
    </div>
  );
}
