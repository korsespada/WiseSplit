'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, PlusCircle } from 'lucide-react';

export function CreateGroup() {
    const { user, fetchGroupData } = useStore();
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

            await supabase.from('group_members').insert({
                group_id: group.id,
                user_id: user.id
            });

            await fetchGroupData(group.id);
        } catch (e) {
            console.error(e);
            const errorMessage = (e as any)?.message || JSON.stringify(e);
            alert(`Ошибка при создании: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-4 px-4 py-8">
            <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Новое событие</h2>
                <p className="text-muted-foreground text-sm">Создайте группу для разделения трат с друзьями</p>
            </div>

            <div className="space-y-4 bg-white p-5 rounded-2xl shadow-sm border">
                <Input
                    className="text-lg py-6 bg-gray-50/50 border-0 shadow-none focus-visible:ring-1"
                    placeholder="Например: Поездка в Питер 🚂"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />
                <Button
                    onClick={handleCreate}
                    disabled={loading || !name.trim()}
                    className="w-full text-lg py-6 rounded-xl font-semibold gap-2"
                >
                    {loading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                        <>
                            <PlusCircle className="w-5 h-5" />
                            Создать
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
