"use client";

import { useActionState, useMemo, useState } from "react";

type ActionState = {
  error?: string;
  success?: string;
};

type ModuleOption = {
  id: string;
  courseTitle: string;
  moduleTitle: string;
};

type LessonBuilderFormProps = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  modules: ModuleOption[];
  submitLabel?: string;
  heading?: string;
  description?: string;
  lessonId?: string;
  initialLesson?: {
    moduleId: string;
    title: string;
    type: "TEXT" | "VIDEO" | "PDF" | "QUIZ";
    description: string;
    content: string;
    videoUrl: string;
    quizTitle: string;
    passingScore: number;
    questions: Array<{
      prompt: string;
      options: Array<{
        label: string;
        isCorrect: boolean;
      }>;
    }>;
  };
};

type QuizOption = {
  id: string;
  label: string;
  isCorrect: boolean;
};

type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
};

const initialState: ActionState = {};

function createOption(index: number, initial?: Partial<QuizOption>): QuizOption {
  return {
    id: initial?.id || `option-${crypto.randomUUID()}`,
    label: initial?.label ?? (index === 0 ? "Opción correcta" : `Opción ${index + 1}`),
    isCorrect: initial?.isCorrect ?? index === 0,
  };
}

function createQuestion(
  index: number,
  initial?: {
    prompt: string;
    options: Array<{ label: string; isCorrect: boolean }>;
  },
): QuizQuestion {
  return {
    id: `question-${crypto.randomUUID()}`,
    prompt: initial?.prompt ?? `Pregunta ${index + 1}`,
    options:
      initial?.options?.length
        ? initial.options.map((option, optionIndex) => createOption(optionIndex, option))
        : [createOption(0), createOption(1), createOption(2)],
  };
}

export function LessonBuilderForm({
  action,
  modules,
  submitLabel = "Crear clase",
  heading = "Nueva clase",
  description = "Cargá una clase de texto, video, PDF o cuestionario desde un formulario guiado. Para cuestionarios, armás las preguntas acá mismo.",
  lessonId,
  initialLesson,
}: LessonBuilderFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [type, setType] = useState(initialLesson?.type || "TEXT");
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initialLesson?.questions?.length
      ? initialLesson.questions.map((question, questionIndex) => createQuestion(questionIndex, question))
      : [createQuestion(0)],
  );

  const questionsJson = useMemo(
    () =>
      JSON.stringify(
        questions.map((question) => ({
          prompt: question.prompt.trim(),
          options: question.options.map((option) => ({
            label: option.label.trim(),
            isCorrect: option.isCorrect,
          })),
        })),
      ),
    [questions],
  );

  function updateQuestion(questionId: string, value: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId ? { ...question, prompt: value } : question,
      ),
    );
  }

  function updateOption(questionId: string, optionId: string, value: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option) =>
                option.id === optionId ? { ...option, label: value } : option,
              ),
            }
          : question,
      ),
    );
  }

  function setCorrectOption(questionId: string, optionId: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option) => ({
                ...option,
                isCorrect: option.id === optionId,
              })),
            }
          : question,
      ),
    );
  }

  function addQuestion() {
    setQuestions((current) => [...current, createQuestion(current.length)]);
  }

  function removeQuestion(questionId: string) {
    setQuestions((current) => (current.length === 1 ? current : current.filter((q) => q.id !== questionId)));
  }

  function addOption(questionId: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: [...question.options, createOption(question.options.length)],
            }
          : question,
      ),
    );
  }

  function removeOption(questionId: string, optionId: string) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId || question.options.length <= 2) {
          return question;
        }

        const options = question.options.filter((option) => option.id !== optionId);
        const hasCorrect = options.some((option) => option.isCorrect);

        return {
          ...question,
          options: hasCorrect
            ? options
            : options.map((option, index) => ({
                ...option,
                isCorrect: index === 0,
              })),
        };
      }),
    );
  }

  return (
    <form className="panel-form" action={formAction}>
      <div className="panel-form__header">
        <h2>{heading}</h2>
        <p>{description}</p>
      </div>

      {lessonId ? <input type="hidden" name="lessonId" value={lessonId} /> : null}

      <label>
        <span>Módulo</span>
        <select name="moduleId" required defaultValue={initialLesson?.moduleId || ""}>
          <option value="" disabled>
            Elegí un módulo
          </option>
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.courseTitle} / {module.moduleTitle}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Título de la clase</span>
        <input name="title" defaultValue={initialLesson?.title || ""} required />
      </label>

      <label>
        <span>Tipo</span>
        <select
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value as "TEXT" | "VIDEO" | "PDF" | "QUIZ")}
        >
          <option value="TEXT">Texto</option>
          <option value="VIDEO">Video</option>
          <option value="PDF">PDF</option>
          <option value="QUIZ">Cuestionario</option>
        </select>
      </label>

      <label>
        <span>Descripción breve</span>
        <textarea name="description" rows={3} defaultValue={initialLesson?.description || ""} />
      </label>

      <label>
        <span>Contenido</span>
        <textarea
          name="content"
          rows={5}
          defaultValue={initialLesson?.content || ""}
          placeholder="Texto de apoyo, instrucciones o desarrollo de la clase."
        />
      </label>

      {(type === "VIDEO" || type === "TEXT") && (
        <label>
          <span>URL de video</span>
          <input name="videoUrl" defaultValue={initialLesson?.videoUrl || ""} placeholder="https://..." />
        </label>
      )}

      <label>
        <span>Título del material adjunto</span>
        <input name="materialTitle" placeholder="Por ejemplo: PDF de apoyo" />
      </label>

      <label>
        <span>Archivo adjunto</span>
        <input name="materialFile" type="file" />
      </label>

      {type === "QUIZ" ? (
        <section className="quiz-builder">
          <div className="quiz-builder__head">
            <div>
              <h3>Cuestionario</h3>
              <p>Armá preguntas, opciones y marcá la respuesta correcta de cada una.</p>
            </div>
          </div>

          <label>
            <span>Título del cuestionario</span>
            <input
              name="quizTitle"
              required={type === "QUIZ"}
              defaultValue={initialLesson?.quizTitle || ""}
              placeholder="Evaluación final del módulo"
            />
          </label>

          <label>
            <span>Puntaje mínimo para aprobar</span>
            <input
              name="passingScore"
              type="number"
              min="1"
              max="100"
              defaultValue={initialLesson?.passingScore || 70}
              required={type === "QUIZ"}
            />
          </label>

          <input type="hidden" name="questionsJson" value={questionsJson} />

          <div className="quiz-builder__questions">
            {questions.map((question, questionIndex) => (
              <article className="quiz-editor-card" key={question.id}>
                <div className="quiz-editor-card__head">
                  <strong>Pregunta {questionIndex + 1}</strong>
                  <button
                    className="button button--ghost button--small"
                    onClick={() => removeQuestion(question.id)}
                    type="button"
                  >
                    Quitar
                  </button>
                </div>

                <label>
                  <span>Enunciado</span>
                  <input
                    value={question.prompt}
                    onChange={(event) => updateQuestion(question.id, event.target.value)}
                    placeholder="Escribí la pregunta"
                  />
                </label>

                <div className="quiz-options">
                  {question.options.map((option, optionIndex) => (
                    <div className="quiz-option-row" key={option.id}>
                      <input
                        checked={option.isCorrect}
                        name={`correct-${question.id}`}
                        onChange={() => setCorrectOption(question.id, option.id)}
                        type="radio"
                      />
                      <input
                        value={option.label}
                        onChange={(event) => updateOption(question.id, option.id, event.target.value)}
                        placeholder={`Opción ${optionIndex + 1}`}
                      />
                      <button
                        className="button button--ghost button--tiny"
                        onClick={() => removeOption(question.id, option.id)}
                        type="button"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  className="button button--ghost button--small"
                  onClick={() => addOption(question.id)}
                  type="button"
                >
                  Agregar opción
                </button>
              </article>
            ))}
          </div>

          <button className="button button--ghost" onClick={addQuestion} type="button">
            Agregar pregunta
          </button>
        </section>
      ) : (
        <input type="hidden" name="questionsJson" value="" />
      )}

      {state.error ? <p className="form-message form-message--error">{state.error}</p> : null}
      {state.success ? <p className="form-message form-message--success">{state.success}</p> : null}

      <button className="button button--primary" type="submit" disabled={pending}>
        {pending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
