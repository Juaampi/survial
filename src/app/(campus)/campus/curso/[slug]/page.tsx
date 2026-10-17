import { submitQuizAction, toggleLessonProgressAction } from "@/lib/actions";
import { requireAnySession } from "@/lib/auth";
import { getAdminCourseBySlug, getEnrollmentByCourseSlug } from "@/lib/queries";
import { formatPercent } from "@/lib/utils";
import { ActionForm } from "@/components/action-form";
import { getMuxPlaybackId, getMuxPlaybackToken } from "@/lib/mux";

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

async function MuxVideo({ url, title }: { url: string; title: string }) {
  const playbackId = getMuxPlaybackId(url);
  if (!playbackId) return null;
  const playback = await getMuxPlaybackToken(playbackId);
  if (!playback.token) {
    return <p className="form-message form-message--error">Diagnóstico Mux: {playback.error}</p>;
  }
  return <iframe className="lesson-media-video" src={`https://player.mux.com/${playbackId}?playback-token=${encodeURIComponent(playback.token)}`} title={title} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
}

export default async function CourseDetailPage(props: PageProps<"/campus/curso/[slug]">) {
  const session = await requireAnySession();
  const { slug } = await props.params;
  const enrollment = session.role === "STUDENT" ? await getEnrollmentByCourseSlug(session.userId, slug) : null;
  const previewCourse = session.role === "ADMIN" ? await getAdminCourseBySlug(slug) : null;
  const course = enrollment?.course || previewCourse;

  if (!course) {
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
    enrollment?.progressEntries.filter((entry) => entry.completedAt).map((entry) => entry.lessonId) || [],
  );

  return (
    <main className="dashboard-content">
      <section className="dashboard-hero dashboard-hero--student">
        <div>
          <p className="eyebrow">Curso activo</p>
          <h1>{course.title}</h1>
          <p className="rich-copy">{course.description}</p>
        </div>
        <div className="course-progress-pill">{enrollment ? formatPercent(enrollment.progressPercent) : "Vista previa"}</div>
      </section>

      <section className="course-detail-summary">
        <article className="panel-card">
          <span className="panel-kicker">Módulos</span>
          <strong>{course.modules.length}</strong>
        </article>
        <article className="panel-card">
          <span className="panel-kicker">Clases</span>
          <strong>
            {course.modules.reduce((acc, module) => acc + module.lessons.length, 0)}
          </strong>
        </article>
        <article className="panel-card">
          <span className="panel-kicker">Evaluaciones</span>
          <strong>{enrollment?.quizAttempts.length || 0}</strong>
        </article>
      </section>

      <section className="stack-layout">
        {course.modules.map((module) => (
          <article className="panel-card" key={module.id}>
            <div className="module-header">
              <div>
                <span className="panel-kicker">Módulo {module.sortOrder}</span>
                <h2>{module.title}</h2>
              </div>
              {module.description ? <p className="rich-copy">{module.description}</p> : null}
            </div>

            <div className="lesson-stack">
              {module.lessons.map((lesson) => {
                const completed = completedLessonIds.has(lesson.id);
                const embeddedVideoUrl = lesson.videoUrl ? getEmbeddedVideoUrl(lesson.videoUrl) : null;
                return (
                  <section className="lesson-card lesson-card--student" id={`clase-${lesson.id}`} key={lesson.id}>
                    <div className="lesson-card__header">
                      <div>
                        <span className="panel-kicker">{lesson.type}</span>
                        <h3>{lesson.title}</h3>
                      </div>

                      {enrollment ? <form action={toggleLessonProgressAction}>
                        <input type="hidden" name="enrollmentId" value={enrollment.id} />
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <input type="hidden" name="completed" value={String(!completed)} />
                        <button className="button button--ghost" type="submit">
                          {completed ? "Marcar pendiente" : "Marcar completada"}
                        </button>
                      </form> : <span className="course-badge course-badge--soft">Vista de administrador</span>}
                    </div>

                    {lesson.description ? <p className="rich-copy">{lesson.description}</p> : null}
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
                          {lesson.materials.map((material) => {
                            if (material.kind === "IMAGE") {
                              return <img className="lesson-media-image" key={material.id} src={material.url} alt={material.title} />;
                            }
                            if (material.kind === "VIDEO") {
                              if (getMuxPlaybackId(material.url)) {
                                return <MuxVideo key={material.id} url={material.url} title={material.title} />;
                              }
                              return <video className="lesson-media-video" key={material.id} controls preload="metadata" src={material.url}>Tu navegador no puede reproducir este video.</video>;
                            }
                            return <a key={material.id} href={material.url} target="_blank" rel="noreferrer">{material.title}</a>;
                          })}
                        </div>
                      </section>
                    ) : null}

                    {lesson.quiz && enrollment ? (
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
