'use client';

import { useStore } from '@/store/useStore';
import { CreateGroup } from '@/components/CreateGroup';
import { Dashboard } from '@/components/Dashboard';
import { GroupList } from '@/components/GroupList';

export default function Home() {
  const { currentGroup, user, isLoading } = useStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no group is selected or joined, show Create/Join flow
  if (!currentGroup) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-gray-50/30">
        <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
          <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
            Добро пожаловать, {user?.first_name || 'Гость'}
          </p>
        </div>

        <div className="mt-12 w-full pb-20">
          <CreateGroup />
          <GroupList />
          <p className="text-center mt-8 text-sm text-gray-400">
            Или попросите друга поделиться ссылкой-приглашением!
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Dashboard />
    </main>
  );
}
