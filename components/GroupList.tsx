'use client';

import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function GroupList() {
    const { userGroups, setGroup } = useStore();

    if (userGroups.length === 0) return null;

    return (
        <div className="w-full max-w-md mx-auto mt-8">
            <h2 className="text-lg font-semibold mb-4 text-center">Ваши события</h2>
            <div className="space-y-3">
                {userGroups.map(group => (
                    <Card key={group.id} className="cursor-pointer hover:bg-gray-50 transition" onClick={() => setGroup(group)}>
                        <CardContent className="p-4 flex justify-between items-center">
                            <span className="font-medium">{group.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {group.created_at && format(new Date(group.created_at), 'd MMM', { locale: ru })}
                            </span>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
