'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';


export function CreateGroup() {
    const { user, setGroup, fetchGroupData } = useStore();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim() || !user) return;
        setLoading(true);

        try {
            const { data: group, error } = await supabase
                .from('groups')
                .insert({ name, created_by: user.id })
                .select()
                .single();

            if (error) throw error;

            // Add creator as member
            await supabase.from('group_members').insert({
                group_id: group.id,
                user_id: user.id
            });

            // Fetch newly created group data to populate store correctly (clearing old expenses, setting members)
            await fetchGroupData(group.id);

            // Generate invite link
            // Use generic bot link or specific if known. 
            // For now, we utilize the start_param mechanism.
            const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'WiseSplitBot';
            const inviteLink = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${botUsername}/start?startapp=${group.id}`)}&text=${encodeURIComponent(`Join my group "${group.name}" on FairShare!`)}`;

            let WebApp;
            if (typeof window !== 'undefined') {
                try {
                    WebApp = (await import('@twa-dev/sdk')).default;
                } catch (e) { }
            }

            if (WebApp && WebApp.initData) {
                WebApp.openTelegramLink(inviteLink);
            } else {
                alert("Group created! Share this ID: " + group.id);
            }

        } catch (e) {
            console.error(e);
            const errorMessage = (e as any)?.message || JSON.stringify(e);
            alert(`Error creating group: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto mt-10">
            <CardHeader>
                <CardTitle>Create a New Group</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input
                    placeholder="Group Name (e.g. Trip to Paris)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Button
                    onClick={handleCreate}
                    disabled={loading || !name}
                    className="w-full"
                >
                    {loading ? 'Creating...' : 'Create & Invite Friends'}
                </Button>
            </CardContent>
        </Card>
    );
}
