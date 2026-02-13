'use client';

import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateSimplifiedDebts, Balance } from '@/lib/debtUtils';
import { AddExpenseDialog } from '@/components/AddExpenseDialog';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function Dashboard() {
    const { currentGroup, expenses, members, user } = useStore();

    const balances = useMemo(() => {
        const bal: Balance = {};
        expenses.forEach(exp => {
            // Payer gets credit
            bal[exp.payer_id] = (bal[exp.payer_id] || 0) + Number(exp.amount);

            // Consumers get debit
            exp.splits.forEach(split => {
                bal[split.user_id] = (bal[split.user_id] || 0) - Number(split.amount);
            });
        });
        return bal;
    }, [expenses]);

    const simplifiedDebts = useMemo(() => calculateSimplifiedDebts(balances), [balances]);

    const getUserName = (id: number) => {
        const member = members.find(m => m.id === id);
        return member ? (member.id === user?.id ? 'Вы' : member.first_name) : `Пользователь ${id}`;
    };

    return (
        <div className="p-4 space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-center mb-4">{currentGroup?.name}</h1>

            <AddExpenseDialog />

            <Card>
                <CardHeader>
                    <CardTitle>Баланс</CardTitle>
                </CardHeader>
                <CardContent>
                    {simplifiedDebts.length === 0 ? (
                        <p className="text-muted-foreground text-center">Все долги выплачены!</p>
                    ) : (
                        <ul className="space-y-2">
                            {simplifiedDebts.map((debt, idx) => (
                                <li key={idx} className="flex justify-between items-center bg-gray-100/50 p-3 rounded-lg">
                                    <span className="text-sm">
                                        <span className="font-semibold text-red-600">{getUserName(debt.from)}</span> должен{' '}
                                        <span className="font-semibold text-green-600">{getUserName(debt.to)}</span>
                                    </span>
                                    <span className="font-bold whitespace-nowrap">{debt.amount.toFixed(2)} ₽</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>История</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {expenses.map(exp => (
                            <li key={exp.id} className="border-b last:border-0 pb-3">
                                <div className="flex justify-between font-medium">
                                    <span>{exp.description}</span>
                                    <span className="font-bold">{exp.amount.toFixed(2)} ₽</span>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Оплатил {getUserName(exp.payer_id)} • {format(new Date(exp.created_at), 'd MMM, HH:mm', { locale: ru })}
                                </div>
                            </li>
                        ))}
                        {expenses.length === 0 && <p className="text-center text-muted-foreground py-4">Трат пока нет.</p>}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
