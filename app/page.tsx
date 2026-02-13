'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { CreateGroup } from '@/components/CreateGroup';
import { Dashboard } from '@/components/Dashboard';
import { GroupList } from '@/components/GroupList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

export default function Home() {
  const { currentGroup, user, isLoading, userGroups } = useStore();
  const [openCreate, setOpenCreate] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no group is selected or joined, show Create/Join flow
  if (!currentGroup) {
    const hasGroups = userGroups.length > 0;

    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-gray-50/30">
        <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
          <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
            Добро пожаловать, {user?.first_name || 'Гость'}
          </p>
        </div>

        <div className="mt-12 w-full pb-20 flex-1 flex flex-col">
          {hasGroups ? (
            <>
              <GroupList />

              <div className="mt-8 text-center">
                <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full shadow-lg gap-2" size="lg">
                      <Plus className="w-5 h-5" />
                      Создать событие
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none">
                    <CreateGroup />
                  </DialogContent>
                </Dialog>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              <CreateGroup />
            </div>
          )}

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
