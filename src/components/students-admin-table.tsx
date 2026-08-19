"use client";

import { useActionState } from "react";

type ActionState = {
  error?: string;
  success?: string;
};

type CourseOption = {
  id: string;
  title: string;
};

type StudentRow = {
  id: string;
  name: string;
  email: string;
  enrollments: Array<{
    id: string;
    status: string;
    progressPercent: number;
    course: {
      id: string;
      title: string;
    };
  }>;
};

type StudentsAdminTableProps = {
  courses: CourseOption[];
  students: StudentRow[];
  updateAction: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  enrollAction: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction: (prev: ActionState, formData: FormData) => Promise<ActionState>;
};

const initialState: ActionState = {};

function StudentRowCard({
  courses,
  student,
  updateAction,
  enrollAction,
  deleteAction,
}: {
  courses: CourseOption[];
  student: StudentRow;
  updateAction: StudentsAdminTableProps["updateAction"];
  enrollAction: StudentsAdminTableProps["enrollAction"];
  deleteAction: StudentsAdminTableProps["deleteAction"];
}) {
  const [updateState, updateFormAction, updatePending] = useActionState(updateAction, initialState);
  const [enrollState, enrollFormAction, enrollPending] = useActionState(enrollAction, initialState);
  const [deleteState, deleteFormAction, deletePending] = useActionState(deleteAction, initialState);

  return (
    <article className="student-row-card">
      <div className="student-row-card__top">
        <div>
          <h3>{student.name}</h3>
          <p>{student.email}</p>
        </div>
        <div className="student-course-badges">
          {student.enrollments.length === 0 ? (
            <span className="course-badge course-badge--soft">Sin cursos</span>
          ) : (
            student.enrollments.map((enrollment) => (
              <span className="course-badge" key={enrollment.id}>
                {enrollment.course.title} · {enrollment.progressPercent}%
              </span>
            ))
          )}
        </div>
      </div>

      <div className="student-row-card__grid">
        <form className="student-inline-form" action={updateFormAction}>
          <input type="hidden" name="userId" value={student.id} />
          <div className="student-inline-form__fields">
            <label>
              <span>Nombre</span>
              <input name="name" defaultValue={student.name} required />
            </label>
            <label>
              <span>Email</span>
              <input name="email" type="email" defaultValue={student.email} required />
            </label>
            <label>
              <span>Nueva contraseña</span>
              <input name="password" placeholder="Opcional: solo si querés resetearla" />
            </label>
          </div>
          {updateState.error ? <p className="form-message form-message--error">{updateState.error}</p> : null}
          {updateState.success ? <p className="form-message form-message--success">{updateState.success}</p> : null}
          <button className="button button--primary button--small" type="submit" disabled={updatePending}>
            {updatePending ? "Guardando..." : "Guardar alumno"}
          </button>
        </form>

        <form className="student-inline-form student-inline-form--side" action={enrollFormAction}>
          <input type="hidden" name="userId" value={student.id} />
          <label>
            <span>Agregar a curso</span>
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
          {enrollState.error ? <p className="form-message form-message--error">{enrollState.error}</p> : null}
          {enrollState.success ? <p className="form-message form-message--success">{enrollState.success}</p> : null}
          <button className="button button--ghost button--small" type="submit" disabled={enrollPending}>
            {enrollPending ? "Inscribiendo..." : "Inscribir"}
          </button>
        </form>

        <form className="student-inline-form student-inline-form--danger" action={deleteFormAction}>
          <input type="hidden" name="userId" value={student.id} />
          <div className="student-inline-form__danger-copy">
            <strong>Eliminar alumno</strong>
            <p>También se eliminan sus inscripciones y progreso asociados.</p>
          </div>
          {deleteState.error ? <p className="form-message form-message--error">{deleteState.error}</p> : null}
          {deleteState.success ? <p className="form-message form-message--success">{deleteState.success}</p> : null}
          <button className="button button--danger button--small" type="submit" disabled={deletePending}>
            {deletePending ? "Eliminando..." : "Eliminar"}
          </button>
        </form>
      </div>
    </article>
  );
}

export function StudentsAdminTable({
  courses,
  students,
  updateAction,
  enrollAction,
  deleteAction,
}: StudentsAdminTableProps) {
  return (
    <section className="students-table-shell">
      <div className="students-table-shell__header">
        <div>
          <h2>Alumnos cargados</h2>
          <p>Editá datos, reiniciá contraseñas y sumalos a cursos sin salir de esta tabla.</p>
        </div>
      </div>

      <div className="students-table-list">
        {students.map((student) => (
          <StudentRowCard
            key={student.id}
            courses={courses}
            student={student}
            updateAction={updateAction}
            enrollAction={enrollAction}
            deleteAction={deleteAction}
          />
        ))}
      </div>
    </section>
  );
}
