'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function AddExpenseDialog() {
    const { user, members, addExpense } = useStore();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [open, setOpen] = useState(false);
    const [payerId, setPayerId] = useState<number | null>(null);

    useEffect(() => {
        if (open && user && selectedUsers.length === 0 && members.length > 0) {
            setSelectedUsers(members.map(m => m.id));
            setPayerId(user.id);
        }
    }, [open, user, members]);

    const handleSubmit = async () => {
        if (!description || !amount || selectedUsers.length === 0 || !payerId) return;

        const totalAmount = parseFloat(amount);
        const splitAmount = totalAmount / selectedUsers.length;

        const splits = selectedUsers.map(userId => ({
            user_id: userId,
            amount: splitAmount,
            is_paid: false
        }));

        await addExpense({
            payer_id: payerId,
            description,
            amount: totalAmount,
            splits
        });

        setOpen(false);
        setDescription('');
        setAmount('');
        setSelectedUsers([]);
        setPayerId(user?.id || null);
    };

    const toggleUser = (userId: number) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const isAllSelected = selectedUsers.length === members.length;
    const toggleAll = () => {
        if (isAllSelected) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(members.map(m => m.id));
        }
    };

    const payer = members.find(m => m.id === payerId);

    // Use Dialog instead of Drawer if Drawer is not available in components/ui, but we can just use Dialog as bottom sheet
    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) {
                setTimeout(() => {
                    setSelectedUsers([]);
                    setDescription('');
                    setAmount('');
                }, 300);
            }
        }}>
            <DialogTrigger asChild>
                <Button className="w-full max-w-md mx-auto rounded-full py-6 text-lg font-semibold shadow-xl gap-2 flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                    Добавить трату
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-4 bg-gray-50 max-h-[90vh] overflow-y-auto">
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl">Новая трата</DialogTitle>
                </DialogHeader>

                <div className="space-y-5 pb-4 mt-2">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border space-y-4">
                        <div>
                            <Input
                                id="desc"
                                className="text-lg bg-transparent border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary pb-3 placeholder:text-gray-300 transition-colors"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="За что платим? (Ужин, такси...)"
                                autoFocus
                            />
                        </div>
                        <div className="relative">
                            <Input
                                id="amount"
                                type="number"
                                className="text-3xl pr-8 py-4 h-14 bg-transparent border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary font-bold transition-colors w-full"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0"
                            />
                            <span className="absolute right-0 top-3 text-gray-400 text-3xl font-medium">₽</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm border space-y-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-sm">Кто платит?</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                            {members.map(m => (
                                <button
                                    key={`payer-${m.id}`}
                                    onClick={() => setPayerId(m.id)}
                                    className={`flex items-center gap-2 p-1.5 pr-3 rounded-full border transition whitespace-nowrap ${payerId === m.id ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'bg-white border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <Avatar className="size-6">
                                        <AvatarImage src={m.photo_url || ''} />
                                        <AvatarFallback className="text-[10px]">{m.first_name[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium text-gray-800">
                                        {m.id === user?.id ? 'Вы' : m.first_name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm border space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-sm">За кого платим? (разделено поровну)</span>
                            <Button variant="ghost" size="sm" onClick={toggleAll} className="h-6 text-xs px-2 text-primary hover:text-primary/80">
                                {isAllSelected ? "Снять всех" : "Выбрать всех"}
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {members.map(member => {
                                const isSelected = selectedUsers.includes(member.id);
                                return (
                                    <div
                                        key={member.id}
                                        className={`flex items-center p-2 rounded-xl border transition cursor-pointer select-none ${isSelected ? 'bg-primary/5 border-primary/50 ring-1 ring-primary/20' : 'bg-gray-50/50 border-gray-100 opacity-70'
                                            }`}
                                        onClick={() => toggleUser(member.id)}
                                    >
                                        <Avatar className="size-8 mr-3">
                                            <AvatarImage src={member.photo_url || ''} />
                                            <AvatarFallback className="text-xs bg-gray-200">{member.first_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-none truncate text-gray-900">
                                                {member.first_name} {member.id === user?.id ? '(Вы)' : ''}
                                            </p>
                                        </div>
                                        <div className={`ml-2 flex items-center justify-center size-5 rounded-full border ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 bg-white'}`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <Button
                        size="lg"
                        className="w-full rounded-2xl py-6 text-lg font-bold"
                        onClick={handleSubmit}
                        disabled={!description || !amount || selectedUsers.length === 0 || !payerId}
                    >
                        Добавить ({amount ? `${amount} ₽` : '...'})
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
