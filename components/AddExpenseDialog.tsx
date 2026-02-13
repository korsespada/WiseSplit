'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';

export function AddExpenseDialog() {
    const { user, members, addExpense, currentGroup } = useStore();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [open, setOpen] = useState(false);

    // Auto-select current user when dialog opens or members load
    useEffect(() => {
        if (open && user && selectedUsers.length === 0) {
            setSelectedUsers([user.id]);
        }
    }, [open, user]);

    const handleSubmit = async () => {
        if (!description || !amount || selectedUsers.length === 0 || !user) return;

        const totalAmount = parseFloat(amount);
        const splitAmount = totalAmount / selectedUsers.length;

        const splits = selectedUsers.map(userId => ({
            user_id: userId,
            amount: splitAmount,
            is_paid: false
        }));

        await addExpense({
            payer_id: user.id,
            description,
            amount: totalAmount,
            splits
        });

        setOpen(false);
        setDescription('');
        setAmount('');
        setSelectedUsers([]);
    };

    const toggleUser = (userId: number) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleInvite = async () => {
        if (!currentGroup) return;
        const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'WiseSplitBot';
        const inviteLink = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${botUsername}/start?startapp=${currentGroup.id}`)}&text=${encodeURIComponent(`Присоединяйся к моей группе "${currentGroup.name}" в FairShare!`)}`;

        let WebApp;
        if (typeof window !== 'undefined') {
            try {
                WebApp = (await import('@twa-dev/sdk')).default;
            } catch (e) { }
        }

        if (WebApp && WebApp.initData) {
            WebApp.openTelegramLink(inviteLink);
        } else {
            window.open(inviteLink, '_blank');
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) setSelectedUsers([]); // Reset on close
        }}>
            <DialogTrigger asChild>
                <Button className="w-full mb-4">Добавить трату</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Новая трата</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="desc">Описание</Label>
                        <Input id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ужин, Такси..." />
                    </div>
                    <div>
                        <Label htmlFor="amount">Сумма (₽)</Label>
                        <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <Label>Делится между ({selectedUsers.length})</Label>
                            <Button variant="ghost" size="sm" onClick={handleInvite} className="h-8 text-xs flex items-center gap-1 text-primary">
                                <UserPlus className="w-3 h-3" />
                                Пригласить друга
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 mt-2 max-h-48 overflow-y-auto p-1 border rounded-md">
                            {members.length === 0 && (
                                <p className="text-xs text-center py-4 text-muted-foreground">Загрузка участников...</p>
                            )}
                            {members.map(member => (
                                <div
                                    key={member.id}
                                    className={`flex items-center justify-between p-2 rounded-sm transition ${selectedUsers.includes(member.id) ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
                                    onClick={() => toggleUser(member.id)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id={`user-${member.id}`}
                                            checked={selectedUsers.includes(member.id)}
                                            onCheckedChange={() => toggleUser(member.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <label className="text-sm font-medium leading-none cursor-pointer">
                                            {member.first_name} {member.id === user?.id ? '(Вы)' : ''}
                                        </label>
                                    </div>
                                    {member.username && <span className="text-[10px] text-gray-400">@{member.username}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <Button className="w-full" onClick={handleSubmit} disabled={!description || !amount || selectedUsers.length === 0}>
                        Сохранить
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
