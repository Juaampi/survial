import { LessonBuilderForm } from "@/components/lesson-builder-form";
import { createLessonAction, updateLessonAction } from "@/lib/actions";
import { getAdminLessonBuilderData } from "@/lib/queries";

export default async function AdminContentsPage() {
  const courses = await getAdminLessonBuilderData();

  return (
    <main className="dashboard-content">
      <section className="dashboard-hero dashboard-hero--compact">
        <div>
          <p className="eyebrow">Contenidos</p>
          <h1>Clases y cuestionarios</h1>
          <p>Acá armás las clases del campus y sus evaluaciones de manera separada y clara.</p>
        </div>
      </section>

      <section className="stack-layout">
        <article className="panel-card">
          <LessonBuilderForm
            action={createLessonAction}
            modules={courses.flatMap((course) =>
              course.modules.map((module) => ({
                id: module.id,
                courseTitle: course.title,
                moduleTitle: module.title,
              })),
            )}
          />
        </article>
      </section>

      <section className="stack-layout">
        <article className="panel-card">
          <div className="panel-form__header">
            <h2>Estructura actual</h2>
            <p>Además de verla, ahora también podés editar cada clase y cada cuestionario desde acá.</p>
          </div>

          <div className="admin-course-tree">
            {courses.map((course) => (
              <section className="lesson-card" key={course.id}>
                <h3>{course.title}</h3>
                <div className="admin-course-tree">
                  {course.modules.map((module) => (
                    <article className="course-module-card" key={module.id}>
                      <div className="course-module-card__head">
                        <span className="panel-kicker">Módulo {module.sortOrder}</span>
                        <h3>{module.title}</h3>
                      </div>
                      {module.description ? <p>{module.description}</p> : null}

                      <div className="course-lesson-list">
                        {module.lessons.map((lesson) => (
                          <details className="lesson-edit-shell" key={lesson.id}>
                            <summary className="lesson-edit-shell__summary">
                              <div>
                                <span className="course-lesson-item__index">Clase {lesson.sortOrder}</span>
                                <strong>{lesson.title}</strong>
                              </div>
                              <span className="course-badge">
                                {lesson.type === "QUIZ"
                                  ? "Cuestionario"
                                  : lesson.type === "VIDEO"
                                    ? "Video"
                                    : lesson.type === "PDF"
                                      ? "PDF"
                                      : "Texto"}
                              </span>
                            </summary>

                            <div className="lesson-edit-shell__body">
                              <LessonBuilderForm
                                action={updateLessonAction}
                                submitLabel="Guardar cambios de la clase"
                                heading={`Editar clase: ${lesson.title}`}
                                description="Actualizá el contenido, el tipo de clase y, si corresponde, el cuestionario."
                                lessonId={lesson.id}
                                modules={courses.flatMap((courseItem) =>
                                  courseItem.modules.map((moduleItem) => ({
                                    id: moduleItem.id,
                                    courseTitle: courseItem.title,
                                    moduleTitle: moduleItem.title,
                                  })),
                                )}
                                initialLesson={{
                                  moduleId: module.id,
                                  title: lesson.title,
                                  type: lesson.type,
                                  description: lesson.description || "",
                                  content: lesson.content || "",
                                  videoUrl: lesson.videoUrl || "",
                                  quizTitle: lesson.quiz?.title || "",
                                  passingScore: lesson.quiz?.passingScore || 70,
                                  questions:
                                    lesson.quiz?.questions.map((question) => ({
                                      prompt: question.prompt,
                                      options: question.options.map((option) => ({
                                        label: option.label,
                                        isCorrect: option.isCorrect,
                                      })),
                                    })) || [],
                                }}
                              />
                            </div>
                          </details>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
