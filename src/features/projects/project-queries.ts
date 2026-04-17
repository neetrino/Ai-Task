import { prisma } from '@/shared/lib/prisma';

export async function listProjectsForUser(userId: string) {
  return prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, slug: true, updatedAt: true },
  });
}

export async function getProjectForUser(slug: string, userId: string) {
  return prisma.project.findFirst({
    where: { slug, ownerId: userId },
  });
}

/** Projects with phases; account page uses the first row (latest by `updatedAt`) for defaults. */
export async function listProjectsWithPhasesForAccount(userId: string) {
  return prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      openaiChatModel: true,
      modelPreset: true,
      pinnedModelId: true,
      phases: {
        orderBy: { lastUsedAt: 'desc' },
        select: { id: true, label: true },
      },
    },
  });
}
