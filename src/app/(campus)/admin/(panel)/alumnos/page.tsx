import { ActionForm } from "@/components/action-form";
import { StudentsAdminTable } from "@/components/students-admin-table";
import {
  createStudentAction,
  deleteStudentAction,
  enrollStudentAction,
  updateStudentAction,
} from "@/lib/actions";
import { getStudentsAndCourses } from "@/lib/queries";
import { formatPercent } from "@/lib/utils";

export default async function AdminStudentsPage() {
  const { students, courses, enrollments } = await getStudentsAndCourses();

  return (
    <main className="dashboard-content">
      <section className="dashboard-hero dashboard-hero--compact">
        <div>
          <p className="eyebrow">Administrador</p>
          <h1>Alumnos e inscripciones</h1>
          <p>Alta de usuarios, asignación de contraseñas e inscripción a cursos.</p>
        </div>
      </section>

      <section className="admin-editor-grid admin-editor-grid--two">
        <article className="panel-card">
          <ActionForm action={createStudentAction} submitLabel="Crear alumno">
            <div className="panel-form__header">
              <h2>Nuevo alumno</h2>
            </div>
            <label>
              <span>Nombre y apellido</span>
              <input name="name" required />
            </label>
            <label>
              <span>Email</span>
              <input name="email" type="email" required />
            </label>
            <label>
              <span>Contraseña inicial</span>
              <input name="password" type="text" required />
            </label>
          </ActionForm>
        </article>

        <article className="panel-card">
          <ActionForm action={enrollStudentAction} submitLabel="Inscribir alumno">
            <div className="panel-form__header">
              <h2>Nueva inscripción</h2>
            </div>
            <label>
              <span>Alumno</span>
              <select name="userId" defaultValue="" required>
                <option value="" disabled>
                  Elegí un alumno
                </option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} - {student.email}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Curso</span>
              <select name="courseId" defaultValue="" required>
                <option value="" disabled>
                  Elegí un curso
                </option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </label>
          </ActionForm>
        </article>
      </section>

      <StudentsAdminTable
        students={students.map((student) => ({
          id: student.id,
          name: student.name,
          email: student.email,
          enrollments: student.enrollments.map((enrollment) => ({
            id: enrollment.id,
            status: enrollment.status,
            progressPercent: enrollment.progressPercent,
            course: {
              id: enrollment.course.id,
              title: enrollment.course.title,
            },
          })),
        }))}
        courses={courses.map((course) => ({
          id: course.id,
          title: course.title,
        }))}
        updateAction={updateStudentAction}
        enrollAction={enrollStudentAction}
        deleteAction={deleteStudentAction}
      />

      <section className="stack-layout">
        <article className="panel-card">
          <h2>Inscripciones activas</h2>
          <div className="table-list">
            {enrollments.map((enrollment) => (
              <div className="table-row" key={enrollment.id}>
                <strong>
                  {enrollment.user.name} → {enrollment.course.title}
                </strong>
                <span>
                  {enrollment.status} · avance {formatPercent(enrollment.progressPercent)}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
