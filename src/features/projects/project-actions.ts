'use server';

import { revalidatePath } from 'next/cache';
import { revalidateProjectData } from '@/shared/lib/project-cache-tags';
import { z } from 'zod';
import { logger } from '@/shared/lib/logger';
import { prisma } from '@/shared/lib/prisma';
import { requireActiveUserId } from '@/shared/lib/session';
import { slugify } from '@/shared/lib/slug';

const createSchema = z.object({
  name: z.string().min(1).max(200),
});

const bitrixSchema = z.object({
  bitrixProjectId: z.string().max(64).optional().nullable(),
  taskOwnerId: z.string().max(64).optional().nullable(),
  taskAssigneeId: z.string().max(64).optional().nullable(),
});

export async function createProject(formData: FormData): Promise<void> {
  const userId = await requireActiveUserId();
  const parsed = createSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.flatten() }, 'createProject validation failed');
    return;
  }
  let slug = slugify(parsed.data.name);
  const clash = await prisma.project.findUnique({ where: { slug } });
  if (clash) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }
  await prisma.project.create({
    data: {
      name: parsed.data.name.trim(),
      slug,
      ownerId: userId,
    },
  });
  revalidatePath('/app');
}

export async function updateProjectBitrix(projectId: string, formData: FormData): Promise<void> {
  const userId = await requireActiveUserId();
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) {
    logger.warn({ projectId }, 'updateProjectBitrix: project not found');
    return;
  }
  const parsed = bitrixSchema.safeParse({
    bitrixProjectId: emptyToNull(formData.get('bitrixProjectId')),
    taskOwnerId: emptyToNull(formData.get('taskOwnerId')),
    taskAssigneeId: emptyToNull(formData.get('taskAssigneeId')),
  });
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.flatten() }, 'updateProjectBitrix validation failed');
    return;
  }
  await prisma.project.update({
    where: { id: projectId },
    data: {
      bitrixProjectId: parsed.data.bitrixProjectId ?? null,
      taskOwnerId: parsed.data.taskOwnerId ?? null,
      taskAssigneeId: parsed.data.taskAssigneeId ?? null,
    },
  });
  revalidatePath(`/app/projects/${project.slug}`);
  revalidateProjectData(projectId);
}

function emptyToNull(v: FormDataEntryValue | null): string | null | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t === '' ? null : t;
}
