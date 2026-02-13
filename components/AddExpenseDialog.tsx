'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function AddExpenseDialog() {
    const { user, members, addExpense } = useStore();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [open, setOpen] = useState(false);

    const handleSubmit = async () => {
        if (!description || !amount || selectedUsers.length === 0 || !user) return;

        const totalAmount = parseFloat(amount);
        const splitAmount = totalAmount / selectedUsers.length;

        const splits = selectedUsers.map(userId => ({
            user_id: userId,
            amount: splitAmount,
            is_paid: false // assuming payer paid full, splits are debts
        }));

        // Adjust for payer logic:
        // If payer is included in split, they "owe themselves", cancel out effectively in net calc?
        // Usually simpler: splits are "who benefitted and how much".
        // Payer paid TOTAL.
        // Calculations: Payer gets Credit +TOTAL. Everyone in split gets Debit -SPLIT.
        // If payer is in split, they get Debit -SPLIT. Net = TOTAL - SPLIT. Correct.

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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full mb-4">Add Expense</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="desc">Description</Label>
                        <Input id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Dinner, Taxi..." />
                    </div>
                    <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                    </div>
                    <div>
                        <Label>Split currently equally among ({selectedUsers.length})</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {members.map(member => (
                                <div key={member.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`user-${member.id}`}
                                        checked={selectedUsers.includes(member.id)}
                                        onCheckedChange={() => toggleUser(member.id)}
                                    />
                                    <label htmlFor={`user-${member.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {member.first_name} {member.id === user?.id ? '(You)' : ''}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Button onClick={handleSubmit} disabled={!description || !amount || selectedUsers.length === 0}>
                        Save Expense
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
