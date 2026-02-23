'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { calculateSimplifiedDebts, Balance } from '@/lib/debtUtils';
import { AddExpenseDialog } from '@/components/AddExpenseDialog';
import { ExpenseDetailsDialog } from '@/components/ExpenseDetailsDialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, UserPlus, Trash2, ReceiptText } from 'lucide-react';
import { Expense } from '@/types';
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup } from '@/components/ui/avatar';

export function Dashboard() {
    const { currentGroup, expenses, members, user, resetGroup, deleteGroup } = useStore();
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

    const balances = useMemo(() => {
        const bal: Balance = {};
        expenses.forEach(exp => {
            bal[exp.payer_id] = (bal[exp.payer_id] || 0) + Number(exp.amount);
            exp.splits.forEach(split => {
                bal[split.user_id] = (bal[split.user_id] || 0) - Number(split.amount);
            });
        });
        return bal;
    }, [expenses]);

    const simplifiedDebts = useMemo(() => calculateSimplifiedDebts(balances), [balances]);

    const getUser = (id: number) => members.find(m => m.id === id);
    const getUserName = (id: number) => {
        const member = getUser(id);
        return member ? (member.id === user?.id ? 'Вы' : member.first_name) : `Пользователь ${id}`;
    };

    const handleInvite = async () => {
        if (!currentGroup) return;
        const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'WiseSplitBot';
        const appShortName = process.env.NEXT_PUBLIC_BOT_SHORT_NAME || 'app';
        const inviteLink = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${botUsername}/${appShortName}?startapp=${currentGroup.id}`)}&text=${encodeURIComponent(`Присоединяйся к моей группе "${currentGroup.name}" в FairShare!`)}`;

        let WebApp;
        if (typeof window !== 'undefined') {
            try { WebApp = (await import('@twa-dev/sdk')).default; } catch (e) { }
        }

        if (WebApp && WebApp.initData) {
            WebApp.openTelegramLink(inviteLink);
        } else {
            window.open(inviteLink, '_blank');
        }
    };

    const handleDelete = async () => {
        if (!currentGroup) return;
        if (confirm('Вы уверены, что хотите удалить это событие? Эту операцию нельзя отменить.')) {
            await deleteGroup(currentGroup.id);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-28">
            <div className="bg-white px-4 pt-6 pb-4 shadow-sm relative z-10 sticky top-0">
                <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="icon" onClick={resetGroup} className="-ml-2 h-10 w-10 shrink-0">
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-xl font-bold truncate px-2 text-center flex-1">{currentGroup?.name}</h1>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 -mr-2 h-10 w-10 shrink-0" onClick={handleDelete}>
                        <Trash2 className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                    <Button variant="outline" size="sm" onClick={handleInvite} className="rounded-full shrink-0 border-dashed border-2 gap-2 text-primary border-primary/50 hover:bg-primary/5 h-10 px-4">
                        <UserPlus className="w-4 h-4" />
                        Пригласить
                    </Button>
                    {members.map(m => (
                        <div key={m.id} className="flex flex-col items-center shrink-0 w-14">
                            <Avatar className="size-10 border shadow-sm mb-1">
                                <AvatarImage src={m.photo_url || ''} />
                                <AvatarFallback className="text-xs bg-indigo-50 text-indigo-700">{m.first_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] truncate w-full text-center text-gray-600 font-medium">
                                {m.id === user?.id ? 'Вы' : m.first_name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 space-y-6">
                <div className="space-y-3">
                    <h3 className="font-semibold text-lg px-1 flex justify-between items-center">
                        Кто кому должен
                        {simplifiedDebts.length > 0 && <span className="text-sm font-normal text-muted-foreground">{simplifiedDebts.length} долгов</span>}
                    </h3>

                    {simplifiedDebts.length === 0 ? (
                        <Card className="border-0 shadow-sm bg-green-50/50">
                            <CardContent className="p-6 text-center text-green-700 font-medium flex flex-col items-center justify-center gap-2">
                                <div className="size-12 rounded-full bg-green-100 flex items-center justify-center mb-2">🎉</div>
                                Все долги выплачены!
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3">
                            {simplifiedDebts.map((debt, idx) => {
                                const fromUser = getUser(debt.from);
                                const toUser = getUser(debt.to);
                                return (
                                    <div key={idx} className="bg-white border shadow-sm p-4 rounded-xl flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 w-full">
                                            <Avatar className="size-10 border border-red-100">
                                                <AvatarImage src={fromUser?.photo_url} />
                                                <AvatarFallback className="bg-red-50 text-red-600">{fromUser?.first_name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 text-sm">
                                                    <span className="font-semibold text-gray-900 truncate max-w-[40%]">{getUserName(debt.from)}</span>
                                                    <span className="text-muted-foreground">должен</span>
                                                    <span className="font-semibold text-gray-900 truncate max-w-[40%]">{getUserName(debt.to)}</span>
                                                </div>
                                                <div className="text-sm font-bold mt-0.5 text-gray-900">{debt.amount.toFixed(2)} ₽</div>
                                            </div>
                                            <Avatar className="size-10 border border-green-100 shrink-0">
                                                <AvatarImage src={toUser?.photo_url} />
                                                <AvatarFallback className="bg-green-50 text-green-600">{toUser?.first_name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <h3 className="font-semibold text-lg px-1">История трат</h3>
                    <Card className="border-0 shadow-sm overflow-hidden">
                        <div className="divide-y">
                            {expenses.map(exp => {
                                const payer = getUser(exp.payer_id);
                                return (
                                    <div
                                        key={exp.id}
                                        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition"
                                        onClick={() => setSelectedExpense(exp)}
                                    >
                                        <div className="w-12 h-12 flex items-center justify-center shrink-0">
                                            <AvatarGroup className="-space-x-4">
                                                {exp.splits.slice(0, 3).map(split => {
                                                    const spUser = getUser(split.user_id);
                                                    return (
                                                        <Avatar key={split.user_id} className="size-8 border-2 border-white ring-0">
                                                            <AvatarImage src={spUser?.photo_url} />
                                                            <AvatarFallback className="text-[10px] bg-gray-100 text-gray-600">{spUser?.first_name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                    );
                                                })}
                                                {exp.splits.length > 3 && (
                                                    <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs font-medium border-2 border-white ring-0">
                                                        +{exp.splits.length - 3}
                                                    </div>
                                                )}
                                            </AvatarGroup>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <p className="font-medium truncate leading-tight">{exp.description}</p>
                                                <p className="font-bold whitespace-nowrap">{exp.amount.toFixed(2)} ₽</p>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Avatar className="size-4">
                                                        <AvatarImage src={payer?.photo_url} />
                                                        <AvatarFallback className="text-[8px]">{payer?.first_name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="truncate max-w-[100px]">{getUserName(exp.payer_id)}</span>
                                                </div>
                                                <span>{format(new Date(exp.created_at), 'd MMM', { locale: ru })}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {expenses.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                                    <ReceiptText className="w-12 h-12 text-gray-200 mb-3" />
                                    <p>Трат пока нет.</p>
                                    <p className="text-sm">Нажмите кнопку ниже, чтобы добавить первую.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            <ExpenseDetailsDialog open={!!selectedExpense} expense={selectedExpense} onClose={() => setSelectedExpense(null)} />

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent z-20">
                <AddExpenseDialog />
            </div>
        </div>
    );
}
