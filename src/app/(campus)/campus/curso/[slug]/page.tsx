import { submitQuizAction, toggleLessonProgressAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { getEnrollmentByCourseSlug } from "@/lib/queries";
import { formatPercent } from "@/lib/utils";
import { ActionForm } from "@/components/action-form";

function getEmbeddedVideoUrl(videoUrl: string) {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = url.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host === "vimeo.com") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }

    if (host === "player.vimeo.com") {
      return videoUrl;
    }

    return null;
  } catch {
    return null;
  }
}

export default async function CourseDetailPage(props: PageProps<"/campus/curso/[slug]">) {
  const session = await requireRole("STUDENT");
  const { slug } = await props.params;
  const enrollment = await getEnrollmentByCourseSlug(session.userId, slug);

  if (!enrollment) {
    return (
      <main className="dashboard-content">
        <article className="panel-card">
          <h1>Curso no encontrado</h1>
          <p>No encontramos una inscripción asociada a este curso.</p>
        </article>
      </main>
    );
  }

  const completedLessonIds = new Set(
    enrollment.progressEntries.filter((entry) => entry.completedAt).map((entry) => entry.lessonId),
  );

  return (
    <main className="dashboard-content">
      <section className="dashboard-hero dashboard-hero--student">
        <div>
          <p className="eyebrow">Curso activo</p>
          <h1>{enrollment.course.title}</h1>
          <p>{enrollment.course.description}</p>
        </div>
        <div className="course-progress-pill">{formatPercent(enrollment.progressPercent)}</div>
      </section>

      <section className="course-detail-summary">
        <article className="panel-card">
          <span className="panel-kicker">Módulos</span>
          <strong>{enrollment.course.modules.length}</strong>
        </article>
        <article className="panel-card">
          <span className="panel-kicker">Clases</span>
          <strong>
            {enrollment.course.modules.reduce((acc, module) => acc + module.lessons.length, 0)}
          </strong>
        </article>
        <article className="panel-card">
          <span className="panel-kicker">Evaluaciones</span>
          <strong>{enrollment.quizAttempts.length}</strong>
        </article>
      </section>

      <section className="stack-layout">
        {enrollment.course.modules.map((module) => (
          <article className="panel-card" key={module.id}>
            <div className="module-header">
              <div>
                <span className="panel-kicker">Módulo {module.sortOrder}</span>
                <h2>{module.title}</h2>
              </div>
              {module.description ? <p>{module.description}</p> : null}
            </div>

            <div className="lesson-stack">
              {module.lessons.map((lesson) => {
                const completed = completedLessonIds.has(lesson.id);
                const embeddedVideoUrl = lesson.videoUrl ? getEmbeddedVideoUrl(lesson.videoUrl) : null;
                return (
                  <section className="lesson-card lesson-card--student" key={lesson.id}>
                    <div className="lesson-card__header">
                      <div>
                        <span className="panel-kicker">{lesson.type}</span>
                        <h3>{lesson.title}</h3>
                      </div>

                      <form action={toggleLessonProgressAction}>
                        <input type="hidden" name="enrollmentId" value={enrollment.id} />
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <input type="hidden" name="completed" value={String(!completed)} />
                        <button className="button button--ghost" type="submit">
                          {completed ? "Marcar pendiente" : "Marcar completada"}
                        </button>
                      </form>
                    </div>

                    {lesson.description ? <p>{lesson.description}</p> : null}
                    {lesson.content ? <div className="rich-copy">{lesson.content}</div> : null}
                    {lesson.videoUrl ? (
                      <div className="lesson-feature-box">
                        <strong>Video de apoyo</strong>
                        {embeddedVideoUrl ? (
                          <div className="lesson-video-frame">
                            <iframe
                              src={embeddedVideoUrl}
                              title={`Video de ${lesson.title}`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          </div>
                        ) : null}
                        <a className="inline-link" href={lesson.videoUrl} target="_blank" rel="noreferrer">
                          {embeddedVideoUrl ? "Abrir video en una pestaña nueva" : "Abrir video"}
                        </a>
                      </div>
                    ) : null}

                    {lesson.materials.length > 0 ? (
                      <section className="lesson-feature-box">
                        <strong>Materiales del tema</strong>
                        <div className="material-list">
                          {lesson.materials.map((material) => (
                            <a key={material.id} href={material.url} target="_blank" rel="noreferrer">
                              {material.title}
                            </a>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {lesson.quiz ? (
                      <ActionForm action={submitQuizAction} submitLabel="Enviar cuestionario" className="quiz-form">
                        <input type="hidden" name="enrollmentId" value={enrollment.id} />
                        <input type="hidden" name="quizId" value={lesson.quiz.id} />
                        <div className="panel-form__header">
                          <h3>{lesson.quiz.title}</h3>
                          <p>Aprobación mínima: {lesson.quiz.passingScore}%</p>
                        </div>
                        {lesson.quiz.questions.map((question) => (
                          <label key={question.id} className="quiz-question">
                            <span>{question.prompt}</span>
                            <select name={`question_${question.id}`} required defaultValue="">
                              <option value="" disabled>
                                Elegí una opción
                              </option>
                              {question.options.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        ))}
                      </ActionForm>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
