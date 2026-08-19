import { PrismaClient } from "@prisma/client";

import { createHash, randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@survialacademia.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme123";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Equipo SurVial",
      passwordHash: hashPassword(adminPassword),
      role: "ADMIN",
    },
    create: {
      name: "Equipo SurVial",
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      role: "ADMIN",
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "alumno@survialacademia.com" },
    update: {
      name: "Alumno Demo",
      passwordHash: hashPassword("alumno123"),
      role: "STUDENT",
    },
    create: {
      name: "Alumno Demo",
      email: "alumno@survialacademia.com",
      passwordHash: hashPassword("alumno123"),
      role: "STUDENT",
    },
  });

  const course = await prisma.course.upsert({
    where: { slug: "lnc-profesional-inicial" },
    update: {
      summary: "Curso base de demostración para mostrar el campus funcionando.",
      description:
        "Recorrido inicial con contenidos transversales, módulo de seguridad y cuestionario básico de cierre.",
      isPublished: true,
      createdById: admin.id,
    },
    create: {
      title: "LNC Profesional Inicial",
      slug: "lnc-profesional-inicial",
      summary: "Curso base de demostración para mostrar el campus funcionando.",
      description:
        "Recorrido inicial con contenidos transversales, módulo de seguridad y cuestionario básico de cierre.",
      isPublished: true,
      createdById: admin.id,
    },
  });

  const [moduleOne, moduleTwo] = await Promise.all([
    prisma.module.upsert({
      where: { id: createHash("sha1").update(`${course.id}-modulo-1`).digest("hex").slice(0, 24) },
      update: {
        title: "Marco legal y rol profesional",
        description: "Normativa, responsabilidades y mirada institucional.",
        sortOrder: 1,
        courseId: course.id,
      },
      create: {
        id: createHash("sha1").update(`${course.id}-modulo-1`).digest("hex").slice(0, 24),
        title: "Marco legal y rol profesional",
        description: "Normativa, responsabilidades y mirada institucional.",
        sortOrder: 1,
        courseId: course.id,
      },
    }),
    prisma.module.upsert({
      where: { id: createHash("sha1").update(`${course.id}-modulo-2`).digest("hex").slice(0, 24) },
      update: {
        title: "Seguridad vial aplicada",
        description: "Prevención, conducción segura y repaso evaluativo.",
        sortOrder: 2,
        courseId: course.id,
      },
      create: {
        id: createHash("sha1").update(`${course.id}-modulo-2`).digest("hex").slice(0, 24),
        title: "Seguridad vial aplicada",
        description: "Prevención, conducción segura y repaso evaluativo.",
        sortOrder: 2,
        courseId: course.id,
      },
    }),
  ]);

  const lessonOne = await prisma.lesson.upsert({
    where: {
      moduleId_slug: {
        moduleId: moduleOne.id,
        slug: "introduccion-al-sistema-lnc",
      },
    },
    update: {
      title: "Introducción al sistema LNC",
      type: "TEXT",
      description: "Panorama general del recorrido formativo.",
      content:
        "Esta clase presenta el marco del curso, el rol del conductor profesional y la organización del campus.",
      sortOrder: 1,
    },
    create: {
      moduleId: moduleOne.id,
      title: "Introducción al sistema LNC",
      slug: "introduccion-al-sistema-lnc",
      type: "TEXT",
      description: "Panorama general del recorrido formativo.",
      content:
        "Esta clase presenta el marco del curso, el rol del conductor profesional y la organización del campus.",
      sortOrder: 1,
    },
  });

  const lessonTwo = await prisma.lesson.upsert({
    where: {
      moduleId_slug: {
        moduleId: moduleTwo.id,
        slug: "buenas-practicas-y-repaso",
      },
    },
    update: {
      title: "Buenas prácticas y repaso",
      type: "QUIZ",
      description: "Cierre con evaluación básica.",
      content: "Repasá los conceptos de conducción segura y luego resolvé el cuestionario.",
      sortOrder: 1,
    },
    create: {
      moduleId: moduleTwo.id,
      title: "Buenas prácticas y repaso",
      slug: "buenas-practicas-y-repaso",
      type: "QUIZ",
      description: "Cierre con evaluación básica.",
      content: "Repasá los conceptos de conducción segura y luego resolvé el cuestionario.",
      sortOrder: 1,
    },
  });

  await prisma.quiz.upsert({
    where: { lessonId: lessonTwo.id },
    update: {
      title: "Cuestionario inicial",
      passingScore: 70,
    },
    create: {
      lessonId: lessonTwo.id,
      title: "Cuestionario inicial",
      passingScore: 70,
    },
  });

  const quiz = await prisma.quiz.findUnique({
    where: { lessonId: lessonTwo.id },
  });

  if (quiz) {
    await prisma.quizQuestion.deleteMany({ where: { quizId: quiz.id } });

    const questions = [
      {
        prompt: "¿Qué permite este campus?",
        options: [
          { label: "Ver cursos y marcar avance", isCorrect: true },
          { label: "Solo enviar mensajes", isCorrect: false },
          { label: "Solo pagar cuotas", isCorrect: false },
        ],
      },
      {
        prompt: "¿Quién administra cursos y alumnos?",
        options: [
          { label: "El panel administrativo de SurVial", isCorrect: true },
          { label: "El navegador del alumno", isCorrect: false },
          { label: "Solo la base de datos", isCorrect: false },
        ],
      },
    ];

    for (const [questionIndex, question] of questions.entries()) {
      await prisma.quizQuestion.create({
        data: {
          quizId: quiz.id,
          prompt: question.prompt,
          sortOrder: questionIndex + 1,
          options: {
            create: question.options,
          },
        },
      });
    }
  }

  const enrollment = await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: course.id,
      },
    },
    update: {
      status: "ACTIVE",
    },
    create: {
      userId: student.id,
      courseId: course.id,
      status: "ACTIVE",
    },
  });

  const lessons = await prisma.lesson.findMany({
    where: {
      module: {
        courseId: course.id,
      },
    },
  });

  for (const lesson of lessons) {
    await prisma.lessonProgress.upsert({
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
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
