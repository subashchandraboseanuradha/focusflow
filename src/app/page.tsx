import { FocusFlowDashboard } from '@/components/focus-flow-dashboard';
import { createServerComponentClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = await createServerComponentClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 pt-12 sm:p-8 md:p-12">
      <FocusFlowDashboard />
      <form action="/auth/signout" method="post" className="mt-4">
        <button type="submit" className="bg-red-500 text-white p-2 rounded">
          Sign out
        </button>
      </form>
    </main>
  );
}