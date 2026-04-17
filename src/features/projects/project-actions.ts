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

export type CreateProjectState = { success: true } | { error: string };

export async function createProject(
  _prev: CreateProjectState | undefined,
  formData: FormData,
): Promise<CreateProjectState> {
  const userId = await requireActiveUserId();
  const parsed = createSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.flatten() }, 'createProject validation failed');
    return { error: 'Enter a valid project name.' };
  }
  const trimmed = parsed.data.name.trim();
  let slug = slugify(trimmed);
  const clash = await prisma.project.findUnique({ where: { slug } });
  if (clash) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }
  await prisma.project.create({
    data: {
      name: trimmed,
      slug,
      ownerId: userId,
    },
  });
  revalidatePath('/app');
  return { success: true };
}

export type RenameProjectState = { error: string } | { success: true };

/**
 * Updates the project display name. Slug is unchanged so existing links keep working.
 */
export async function renameProject(projectId: string, name: string): Promise<RenameProjectState> {
  const userId = await requireActiveUserId();
  const parsed = createSchema.safeParse({ name });
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.flatten() }, 'renameProject validation failed');
    return { error: 'Enter a valid project name.' };
  }
  const trimmed = parsed.data.name.trim();
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
    select: { id: true, name: true, slug: true },
  });
  if (!project) {
    logger.warn({ projectId }, 'renameProject: project not found');
    return { error: 'Project not found.' };
  }
  if (trimmed === project.name) {
    return { success: true };
  }
  await prisma.project.update({
    where: { id: projectId },
    data: { name: trimmed },
  });
  revalidatePath('/app');
  revalidatePath(`/app/projects/${project.slug}`);
  revalidateProjectData(projectId);
  return { success: true };
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
