'use client';

import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup } from '@/components/ui/avatar';
import { ChevronRight } from 'lucide-react';

export function GroupList() {
    const { userGroups, fetchGroupData, user } = useStore();

    if (userGroups.length === 0) return null;

    return (
        <div className="w-full max-w-md mx-auto mt-6 px-4">
            <h2 className="text-xl font-bold mb-4">Ваши события</h2>
            <div className="space-y-4">
                {userGroups.map((group: any) => {
                    const members = group.members?.map((m: any) => m.users) || [];
                    const limitedMembers = members.slice(0, 5);
                    const extra = members.length > 5 ? members.length - 5 : 0;

                    return (
                        <Card
                            key={group.id}
                            className="cursor-pointer border-0 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                            onClick={() => fetchGroupData(group.id)}
                        >
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-lg leading-tight">{group.name}</h3>
                                    <span className="text-xs text-muted-foreground">
                                        {group.created_at && format(new Date(group.created_at), 'd MMMM yyyy', { locale: ru })}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    {members.length > 0 && (
                                        <AvatarGroup className="-space-x-3">
                                            {limitedMembers.map((m: any) => (
                                                <Avatar key={m.id} className="border-2 border-white size-8">
                                                    <AvatarImage src={m.photo_url || ''} />
                                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                        {m.first_name?.charAt(0) || '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ))}
                                            {extra > 0 && (
                                                <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium ring-2 ring-white">
                                                    +{extra}
                                                </div>
                                            )}
                                        </AvatarGroup>
                                    )}
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
