import { redirect } from 'next/navigation';
import { PublicDemoLanding } from '@/components/public/PublicDemoLanding';
import { requireAgentContext } from '@/lib/auth/session';

export default async function HomePage() {
  const auth = await requireAgentContext();
  if (auth.ok) {
    redirect('/tickets');
  }

  return <PublicDemoLanding />;
}
