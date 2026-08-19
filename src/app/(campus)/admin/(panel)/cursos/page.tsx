import { ActionForm } from "@/components/action-form";
import { createCourseAction, createModuleAction, updateModuleAction } from "@/lib/actions";
import { getAdminCourses } from "@/lib/queries";

function getLessonTypeLabel(type: string) {
  switch (type) {
    case "QUIZ":
      return "Cuestionario";
    case "VIDEO":
      return "Video";
    case "PDF":
      return "PDF";
    default:
      return "Texto";
  }
}

export default async function AdminCoursesPage() {
  const courses = await getAdminCourses();

  return (
    <main className="dashboard-content">
      <section className="dashboard-hero dashboard-hero--compact">
        <div>
          <p className="eyebrow">Administrador</p>
          <h1>Cursos, módulos y clases</h1>
          <p>Todo el contenido del campus se gestiona desde este panel.</p>
        </div>
      </section>

      <section className="admin-editor-grid">
        <article className="panel-card">
          <ActionForm action={createCourseAction} submitLabel="Crear curso">
            <div className="panel-form__header">
              <h2>Nuevo curso</h2>
              <p>Creá la ficha principal del curso y elegí si queda publicado en la portada.</p>
            </div>
            <label>
              <span>Título</span>
              <input name="title" required />
            </label>
            <label>
              <span>Resumen</span>
              <textarea name="summary" rows={3} required />
            </label>
            <label>
              <span>Descripción</span>
              <textarea name="description" rows={5} required />
            </label>
            <label>
              <span>Portada</span>
              <input name="thumbnail" type="file" accept="image/*" />
            </label>
            <label className="checkbox-row">
              <input name="isPublished" type="checkbox" />
              <span>Mostrar este curso en la landing</span>
            </label>
          </ActionForm>
        </article>

        <article className="panel-card">
          <ActionForm action={createModuleAction} submitLabel="Crear módulo">
            <div className="panel-form__header">
              <h2>Nuevo módulo</h2>
            </div>
            <label>
              <span>Curso</span>
              <select name="courseId" required defaultValue="">
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
            <label>
              <span>Título del módulo</span>
              <input name="title" required />
            </label>
            <label>
              <span>Descripción</span>
              <textarea name="description" rows={4} />
            </label>
          </ActionForm>
        </article>
      </section>

      <section className="stack-layout">
        {courses.map((course) => (
          <article className="panel-card" key={course.id}>
            <div className="module-header">
              <div>
                <span className="panel-kicker">{course.isPublished ? "Publicado" : "Borrador"}</span>
                <h2>{course.title}</h2>
              </div>
              <p>{course.summary}</p>
            </div>

            <div className="admin-course-tree">
              {course.modules.map((module) => (
                <section className="course-module-card" key={module.id}>
                  <div className="course-module-card__head">
                    <span className="panel-kicker">Módulo {module.sortOrder}</span>
                    <h3>{module.title}</h3>
                  </div>
                  {module.description ? <p>{module.description}</p> : null}

                  <ActionForm
                    action={updateModuleAction}
                    submitLabel="Guardar cambios del módulo"
                    className="panel-form panel-form--inline"
                  >
                    <input type="hidden" name="moduleId" value={module.id} />
                    <div className="module-edit-grid">
                      <label>
                        <span>Título del módulo</span>
                        <input name="title" defaultValue={module.title} required />
                      </label>
                      <label className="module-edit-grid__full">
                        <span>Descripción</span>
                        <textarea name="description" rows={3} defaultValue={module.description || ""} />
                      </label>
                    </div>
                  </ActionForm>

                  <div className="course-lesson-list">
                    {module.lessons.map((lesson) => (
                      <article className="course-lesson-item" key={lesson.id}>
                        <div className="course-lesson-item__main">
                          <span className="course-lesson-item__index">Clase {lesson.sortOrder}</span>
                          <strong>{lesson.title}</strong>
                        </div>
                        <div className="course-lesson-item__meta">
                          <span className="course-badge">{getLessonTypeLabel(lesson.type)}</span>
                          {lesson.materials.length > 0 ? (
                            <span className="course-badge course-badge--soft">
                              {lesson.materials.length} material{lesson.materials.length === 1 ? "" : "es"}
                            </span>
                          ) : null}
                          {lesson.quiz ? (
                            <span className="course-badge course-badge--soft">
                              Cuestionario: {lesson.quiz.questions.length} pregunta
                              {lesson.quiz.questions.length === 1 ? "" : "s"}
                            </span>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
