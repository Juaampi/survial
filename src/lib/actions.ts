"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearSession, authenticate, requireAnySession, requireRole, setSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/storage";
import { slugify } from "@/lib/utils";

type ActionState = {
  error?: string;
  success?: string;
};

type ParsedQuestion = {
  prompt: string;
  options: Array<{ label: string; isCorrect: boolean }>;
};

function parseQuizQuestions(rawValue: string) {
  let parsedQuestions: ParsedQuestion[];

  try {
    parsedQuestions = JSON.parse(rawValue);
  } catch {
    return { error: "No pudimos leer las preguntas del cuestionario." } as const;
  }

  if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
    return { error: "Agregá al menos una pregunta al cuestionario." } as const;
  }

  for (const question of parsedQuestions) {
    if (!question.prompt?.trim()) {
      return { error: "Cada pregunta necesita un enunciado." } as const;
    }

    if (!Array.isArray(question.options) || question.options.length < 2) {
      return { error: "Cada pregunta necesita al menos dos opciones." } as const;
    }

    const validOptions = question.options.filter((option) => option.label?.trim());
    if (validOptions.length < 2) {
      return { error: "Cada pregunta necesita al menos dos opciones con texto." } as const;
    }

    const correctOptions = validOptions.filter((option) => option.isCorrect);
    if (correctOptions.length !== 1) {
      return { error: "Marcá una sola respuesta correcta por pregunta." } as const;
    }
  }

  return {
    data: parsedQuestions.map((question) => ({
      prompt: question.prompt.trim(),
      options: question.options
        .filter((option) => option.label?.trim())
        .map((option) => ({
          label: option.label.trim(),
          isCorrect: option.isCorrect,
        })),
    })),
  } as const;
}

export async function loginStudentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  const session = await authenticate(email, password);

  if (!session || session.role !== "STUDENT") {
    return { error: "No encontramos un alumno con esos datos." };
  }

  await setSession(session);
  redirect("/campus");
}

export async function loginAdminAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  const session = await authenticate(email, password);

  if (!session || session.role !== "ADMIN") {
    return { error: "Acceso administrativo inválido." };
  }

  await setSession(session);
  redirect("/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function createCourseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const admin = await requireRole("ADMIN");
    const title = String(formData.get("title") || "").trim();
    const summary = String(formData.get("summary") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const isPublished = formData.get("isPublished") === "on";
    const thumbnailFile = formData.get("thumbnail");

    if (!title || !summary || !description) {
      return { error: "Completá título, resumen y descripción." };
    }

    const slugBase = slugify(title);
    if (!slugBase) {
      return { error: "Usá un título con letras o números para poder crear el curso." };
    }

    const existing = await prisma.course.count({
      where: { slug: { startsWith: slugBase } },
    });
    const slug = existing ? `${slugBase}-${existing + 1}` : slugBase;

    let thumbnailUrl: string | null = null;

    if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
      try {
        const thumbnail = await saveUpload(thumbnailFile, "course-thumbnails");
        thumbnailUrl = thumbnail?.url ?? null;
      } catch (error) {
        console.error("createCourseAction upload failed", error);
        return { error: "No pudimos guardar la portada del curso. Probá con otra imagen o crealo sin portada." };
      }
    }

    await prisma.course.create({
      data: {
        title,
        slug,
        summary,
        description,
        isPublished,
        thumbnailUrl,
        createdById: admin.userId,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/cursos");
    return { success: "Curso creado." };
  } catch (error) {
    console.error("createCourseAction failed", error);
    return { error: "No pudimos crear el curso en producción. Revisá la portada o intentá de nuevo en unos segundos." };
  }
}

export async function createModuleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const courseId = String(formData.get("courseId") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!courseId || !title) {
    return { error: "Elegí un curso y un título para el módulo." };
  }

  const count = await prisma.module.count({ where: { courseId } });

  await prisma.module.create({
    data: {
      courseId,
      title,
      description: description || null,
      sortOrder: count + 1,
    },
  });

  revalidatePath("/admin/cursos");
  return { success: "Módulo creado." };
}

export async function updateModuleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const moduleId = String(formData.get("moduleId") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!moduleId || !title) {
    return { error: "Completá el título del módulo." };
  }

  const existing = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { id: true },
  });

  if (!existing) {
    return { error: "No encontramos ese módulo." };
  }

  await prisma.module.update({
    where: { id: moduleId },
    data: {
      title,
      description: description || null,
    },
  });

  revalidatePath("/admin/cursos");
  return { success: "Módulo actualizado." };
}

export async function createLessonAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const moduleId = String(formData.get("moduleId") || "");
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "TEXT") as "VIDEO" | "PDF" | "TEXT" | "QUIZ";
  const description = String(formData.get("description") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const videoUrl = String(formData.get("videoUrl") || "").trim();
  const materialTitle = String(formData.get("materialTitle") || "").trim();
  const materialFile = formData.get("materialFile");
  const quizTitle = String(formData.get("quizTitle") || "").trim();
  const passingScore = Number(formData.get("passingScore") || 70);
  const questionsRaw = String(formData.get("questionsJson") || "").trim();

  if (!moduleId || !title) {
    return { error: "Elegí un módulo y un título para la clase." };
  }

  let parsedQuestions: ParsedQuestion[] = [];

  if (type === "QUIZ") {
    if (!quizTitle) {
      return { error: "Completá el título del cuestionario." };
    }

    const parsed = parseQuizQuestions(questionsRaw);

    if ("error" in parsed) {
      return { error: parsed.error };
    }

    parsedQuestions = parsed.data;
  }

  const count = await prisma.lesson.count({ where: { moduleId } });
  const slug = slugify(title);

  const createdLesson = await prisma.lesson.create({
    data: {
      moduleId,
      title,
      slug,
      type,
      description: description || null,
      content: content || null,
      videoUrl: videoUrl || null,
      sortOrder: count + 1,
    },
  });

  if (materialFile instanceof File && materialFile.size > 0) {
    const upload = await saveUpload(materialFile, "lesson-materials");
    if (upload) {
      await prisma.material.create({
        data: {
          lessonId: createdLesson.id,
          title: materialTitle || upload.fileName,
          url: upload.url,
          mimeType: upload.mimeType,
          kind: upload.mimeType.includes("pdf")
            ? "PDF"
            : upload.mimeType.startsWith("image/")
              ? "IMAGE"
              : upload.mimeType.startsWith("video/")
                ? "VIDEO"
                : "FILE",
        },
      });
    }
  }

  if (type === "QUIZ") {
    await prisma.quiz.create({
      data: {
        lessonId: createdLesson.id,
        title: quizTitle,
        passingScore,
        questions: {
          create: parsedQuestions.map((question, questionIndex) => ({
            prompt: question.prompt,
            sortOrder: questionIndex + 1,
            options: {
              create: question.options.map((option) => ({
                label: option.label,
                isCorrect: option.isCorrect,
              })),
            },
          })),
        },
      },
    });
  }

  revalidatePath("/admin/cursos");
  return { success: "Clase creada." };
}

export async function updateLessonAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const lessonId = String(formData.get("lessonId") || "");
  const moduleId = String(formData.get("moduleId") || "");
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "TEXT") as "VIDEO" | "PDF" | "TEXT" | "QUIZ";
  const description = String(formData.get("description") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const videoUrl = String(formData.get("videoUrl") || "").trim();
  const materialTitle = String(formData.get("materialTitle") || "").trim();
  const materialFile = formData.get("materialFile");
  const quizTitle = String(formData.get("quizTitle") || "").trim();
  const passingScore = Number(formData.get("passingScore") || 70);
  const questionsRaw = String(formData.get("questionsJson") || "").trim();

  if (!lessonId || !moduleId || !title) {
    return { error: "Completá módulo y título de la clase." };
  }

  const existingLesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      quiz: true,
    },
  });

  if (!existingLesson) {
    return { error: "No encontramos esa clase." };
  }

  let parsedQuestions: ParsedQuestion[] = [];

  if (type === "QUIZ") {
    if (!quizTitle) {
      return { error: "Completá el título del cuestionario." };
    }

    const parsed = parseQuizQuestions(questionsRaw);

    if ("error" in parsed) {
      return { error: parsed.error };
    }

    parsedQuestions = parsed.data;
  }

  const duplicateSlug = slugify(title);

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      moduleId,
      title,
      slug: duplicateSlug,
      type,
      description: description || null,
      content: content || null,
      videoUrl: videoUrl || null,
    },
  });

  if (materialFile instanceof File && materialFile.size > 0) {
    const upload = await saveUpload(materialFile, "lesson-materials");
    if (upload) {
      await prisma.material.create({
        data: {
          lessonId,
          title: materialTitle || upload.fileName,
          url: upload.url,
          mimeType: upload.mimeType,
          kind: upload.mimeType.includes("pdf")
            ? "PDF"
            : upload.mimeType.startsWith("image/")
              ? "IMAGE"
              : upload.mimeType.startsWith("video/")
                ? "VIDEO"
                : "FILE",
        },
      });
    }
  }

  if (type === "QUIZ") {
    let quizId = existingLesson.quiz?.id;

    if (!quizId) {
      const createdQuiz = await prisma.quiz.create({
        data: {
          lessonId,
          title: quizTitle,
          passingScore,
        },
      });
      quizId = createdQuiz.id;
    } else {
      await prisma.quiz.update({
        where: { id: quizId },
        data: {
          title: quizTitle,
          passingScore,
        },
      });
    }

    await prisma.quizQuestion.deleteMany({
      where: { quizId },
    });

    await prisma.quiz.update({
      where: { id: quizId },
      data: {
        questions: {
          create: parsedQuestions.map((question, questionIndex) => ({
            prompt: question.prompt,
            sortOrder: questionIndex + 1,
            options: {
              create: question.options.map((option) => ({
                label: option.label,
                isCorrect: option.isCorrect,
              })),
            },
          })),
        },
      },
    });
  } else if (existingLesson.quiz) {
    await prisma.quiz.delete({
      where: { id: existingLesson.quiz.id },
    });
  }

  revalidatePath("/admin/contenidos");
  revalidatePath("/admin/cursos");
  return { success: "Clase actualizada." };
}

export async function createStudentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();

  if (!name || !email || password.length < 6) {
    return { error: "Completá nombre, email y una contraseña de al menos 6 caracteres." };
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return { error: "Ese email ya existe." };
  }

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      role: "STUDENT",
    },
  });

  revalidatePath("/admin/alumnos");
  return { success: "Alumno creado." };
}

export async function updateStudentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const userId = String(formData.get("userId") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();

  if (!userId || !name || !email) {
    return { error: "Completá nombre e email del alumno." };
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });

  if (!existing || existing.role !== "STUDENT") {
    return { error: "No encontramos ese alumno." };
  }

  const duplicated = await prisma.user.findFirst({
    where: {
      email,
      id: { not: userId },
    },
    select: { id: true },
  });

  if (duplicated) {
    return { error: "Ya existe otro usuario con ese email." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      ...(password ? { passwordHash: hashPassword(password) } : {}),
    },
  });

  revalidatePath("/admin/alumnos");
  return { success: password ? "Alumno actualizado y contraseña reiniciada." : "Alumno actualizado." };
}

export async function deleteStudentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const userId = String(formData.get("userId") || "");

  if (!userId) {
    return { error: "No encontramos el alumno a eliminar." };
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!existing || existing.role !== "STUDENT") {
    return { error: "No encontramos ese alumno." };
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/admin/alumnos");
  return { success: "Alumno eliminado." };
}

export async function enrollStudentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("ADMIN");
  const userId = String(formData.get("userId") || "");
  const courseId = String(formData.get("courseId") || "");

  if (!userId || !courseId) {
    return { error: "Elegí alumno y curso." };
  }

  const enrollment = await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    update: {
      status: "ACTIVE",
    },
    create: {
      userId,
      courseId,
    },
  });

  const lessons = await prisma.lesson.findMany({
    where: {
      module: {
        courseId,
      },
    },
    select: { id: true },
  });

  if (lessons.length > 0) {
    await prisma.$transaction(
      lessons.map((lesson) =>
        prisma.lessonProgress.upsert({
          where: {
            enrollmentId_lessonId: {
              enrollmentId: enrollment.id,
              lessonId: lesson.id,
            },
          },
          update: {},
          create: {
            enrollmentId: enrollment.id,
            lessonId: lesson.id,
          },
        }),
      ),
    );
  }

  revalidatePath("/admin/alumnos");
  return { success: "Alumno inscripto." };
}

async function recalculateEnrollmentProgress(enrollmentId: string) {
  const [totalLessons, completedLessons] = await Promise.all([
    prisma.lessonProgress.count({ where: { enrollmentId } }),
    prisma.lessonProgress.count({
      where: {
        enrollmentId,
        completedAt: { not: null },
      },
    }),
  ]);

  const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progressPercent,
      status: progressPercent === 100 ? "COMPLETED" : "ACTIVE",
      completedAt: progressPercent === 100 ? new Date() : null,
    },
  });
}

export async function toggleLessonProgressAction(formData: FormData) {
  const session = await requireAnySession();
  const enrollmentId = String(formData.get("enrollmentId") || "");
  const lessonId = String(formData.get("lessonId") || "");
  const completed = formData.get("completed") === "true";

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      userId: session.userId,
    },
    include: {
      course: true,
    },
  });

  if (!enrollment) {
    redirect("/campus");
  }

  await prisma.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId,
        lessonId,
      },
    },
    update: {
      completedAt: completed ? new Date() : null,
    },
    create: {
      enrollmentId,
      lessonId,
      completedAt: completed ? new Date() : null,
    },
  });

  await recalculateEnrollmentProgress(enrollmentId);
  revalidatePath(`/campus/curso/${enrollment.course.slug}`);
  revalidatePath("/campus");
}

export async function submitQuizAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("STUDENT");
  const enrollmentId = String(formData.get("enrollmentId") || "");
  const quizId = String(formData.get("quizId") || "");

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      lesson: true,
      questions: {
        include: { options: true },
      },
    },
  });

  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, userId: session.userId },
    include: { course: true },
  });

  if (!quiz || !enrollment) {
    return { error: "No pudimos procesar el cuestionario." };
  }

  let correct = 0;
  const answers: Record<string, string> = {};

  for (const question of quiz.questions) {
    const answer = String(formData.get(`question_${question.id}`) || "");
    answers[question.id] = answer;
    const selected = question.options.find((option) => option.id === answer);
    if (selected?.isCorrect) {
      correct += 1;
    }
  }

  const score = quiz.questions.length === 0 ? 0 : Math.round((correct / quiz.questions.length) * 100);
  const passed = score >= quiz.passingScore;

  await prisma.quizAttempt.create({
    data: {
      enrollmentId,
      quizId,
      score,
      passed,
      answersJson: JSON.stringify(answers),
    },
  });

  if (passed) {
    await prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId: quiz.lessonId,
        },
      },
      update: {
        completedAt: new Date(),
      },
      create: {
        enrollmentId,
        lessonId: quiz.lessonId,
        completedAt: new Date(),
      },
    });

    await recalculateEnrollmentProgress(enrollmentId);
  }

  revalidatePath(`/campus/curso/${enrollment.course.slug}`);
  revalidatePath("/campus");

  return passed
    ? { success: `Cuestionario aprobado con ${score}%.` }
    : { error: `Obtuviste ${score}%. Necesitás ${quiz.passingScore}% para aprobar.` };
}
