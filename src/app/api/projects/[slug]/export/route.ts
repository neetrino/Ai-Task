import { DEFAULT_PLAN, parsePlanFromJson } from '@/shared/domain/plan';
import { planToMarkdown } from '@/shared/lib/plan-markdown';
import { prisma } from '@/shared/lib/prisma';
import { requireActiveUserForApi } from '@/shared/lib/session';

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await context.params;
  const authResult = await requireActiveUserForApi();
  if ('error' in authResult) {
    return authResult.error;
  }
  const { userId } = authResult;

  const project = await prisma.project.findFirst({
    where: { slug, ownerId: userId },
  });
  if (!project) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const url = new URL(req.url);
  const phaseParam = url.searchParams.get('phase');

  let phaseId: string | null = null;
  if (phaseParam) {
    const phase = await prisma.phase.findFirst({
      where: { id: phaseParam, projectId: project.id },
    });
    if (!phase) {
      return Response.json({ error: 'Phase not found' }, { status: 404 });
    }
    phaseId = phase.id;
  }

  const snapshot = await prisma.planSnapshot.findFirst({
    where: { projectId: project.id, phaseId },
    orderBy: { updatedAt: 'desc' },
  });

  let plan;
  try {
    plan = snapshot ? parsePlanFromJson(snapshot.payload) : DEFAULT_PLAN;
  } catch {
    plan = DEFAULT_PLAN;
  }

  const md = planToMarkdown(plan, project.name);
  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${project.slug}-plan.md"`,
    },
  });
}
