import { prisma } from "@/lib/prisma";

export async function getLandingCourses() {
  return prisma.course.findMany({
    where: { isPublished: true },
    include: {
      modules: {
        include: {
          lessons: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminDashboardData() {
  const [students, courses, enrollments, materials, lessons] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.material.count(),
    prisma.lesson.count(),
  ]);

  return { students, courses, enrollments, materials, lessons };
}

export async function getAdminCourses() {
  return prisma.course.findMany({
    include: {
      modules: {
        include: {
          lessons: {
            include: {
              materials: true,
              quiz: {
                include: {
                  questions: {
                    include: { options: true },
                    orderBy: { sortOrder: "asc" },
                  },
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStudentsAndCourses() {
  const [students, courses, enrollments] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        enrollments: {
          include: {
            course: true,
          },
          orderBy: {
            enrolledAt: "desc",
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      orderBy: { title: "asc" },
    }),
    prisma.enrollment.findMany({
      include: {
        user: true,
        course: true,
      },
      orderBy: { enrolledAt: "desc" },
    }),
  ]);

  return { students, courses, enrollments };
}

export async function getAdminMaterials() {
  return prisma.material.findMany({
    include: {
      lesson: {
        include: {
          module: {
            include: {
              course: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminLessonBuilderData() {
  return prisma.course.findMany({
    include: {
      modules: {
        include: {
          lessons: {
            include: {
              materials: true,
              quiz: {
                include: {
                  questions: {
                    include: { options: true },
                    orderBy: { sortOrder: "asc" },
                  },
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { title: "asc" },
  });
}

export async function getStudentDashboard(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      enrollments: {
        include: {
          course: {
            include: {
              modules: {
                include: {
                  lessons: {
                    include: {
                      materials: true,
                      quiz: {
                        include: {
                          questions: {
                            include: { options: true },
                            orderBy: { sortOrder: "asc" },
                          },
                        },
                      },
                    },
                    orderBy: { sortOrder: "asc" },
                  },
                },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
          progressEntries: true,
          quizAttempts: {
            orderBy: { submittedAt: "desc" },
          },
        },
        orderBy: { enrolledAt: "desc" },
      },
    },
  });
}

export async function getEnrollmentByCourseSlug(userId: string, slug: string) {
  return prisma.enrollment.findFirst({
    where: {
      userId,
      course: {
        slug,
      },
    },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: {
                include: {
                  materials: true,
                  quiz: {
                    include: {
                      questions: {
                        include: { options: true },
                        orderBy: { sortOrder: "asc" },
                      },
                      attempts: {
                        where: { enrollment: { userId } },
                        orderBy: { submittedAt: "desc" },
                      },
                    },
                  },
                },
                orderBy: { sortOrder: "asc" },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      progressEntries: true,
      quizAttempts: {
        orderBy: { submittedAt: "desc" },
      },
    },
  });
}
