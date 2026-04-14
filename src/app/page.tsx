import { auth } from '@/auth';
import { HomeLanding } from '@/features/marketing/HomeLanding';

export default async function HomePage() {
  const session = await auth();
  return <HomeLanding isAuthenticated={Boolean(session?.user)} />;
}
