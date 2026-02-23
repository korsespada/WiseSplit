'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Expense, Comment } from '@/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Send, UserPlus, Trash2, Edit2, X, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ExpenseDetailsDialogProps {
    expense: Expense | null;
    open: boolean;
    onClose: () => void;
}

export function ExpenseDetailsDialog({ expense, open, onClose }: ExpenseDetailsDialogProps) {
    const { user, members, fetchComments, addComment, currentGroup, updateExpenseAmount, deleteExpense, updateExpenseSplits } = useStore();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [newAmount, setNewAmount] = useState('');

    const [isEditingSplits, setIsEditingSplits] = useState(false);
    const [selectedSplitIds, setSelectedSplitIds] = useState<number[]>([]);

    useEffect(() => {
        if (expense) {
            setNewAmount(expense.amount.toString());
            setIsEditing(false);
            setIsEditingSplits(false);
            setSelectedSplitIds(expense.splits.map(s => s.user_id));
        }
    }, [expense, open]);

    useEffect(() => {
        if (expense && open) {
            setLoadingComments(true);
            fetchComments(expense.id).then(data => {
                setComments(data);
                setLoadingComments(false);
            });
        }
    }, [expense, open, fetchComments]);

    const handleAddComment = async () => {
        if (!newComment.trim() || !expense) return;
        await addComment(expense.id, newComment);
        setNewComment('');
        // Refresh comments
        const data = await fetchComments(expense.id);
        setComments(data);
    };

    const getUserName = (id: number | string) => {
        const member = members.find(m => String(m.id) === String(id));
        return member ? (String(member.id) === String(user?.id) ? 'Вы' : member.first_name) : `Пользователь ${id}`;
    };

    const isAuthor = String(user?.id) === String(expense?.payer_id);

    const handleDelete = async () => {
        if (!expense) return;
        if (confirm('Вы уверены, что хотите удалить эту трату?')) {
            await deleteExpense(expense.id);
            onClose();
        }
    };

    const handleUpdateAmount = async () => {
        if (!expense) return;
        const parsed = parseFloat(newAmount);
        if (!isNaN(parsed) && parsed > 0) {
            await updateExpenseAmount(expense.id, parsed);
            setIsEditing(false);
            onClose();
        }
    };

    const handleInvite = async () => {
        if (!currentGroup) return;
        const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'WiseSplitBot';
        const appShortName = process.env.NEXT_PUBLIC_BOT_SHORT_NAME || 'app';
        // Deep link to expense could be better, but for now group invite
        const inviteLink = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${botUsername}/${appShortName}?startapp=${currentGroup.id}`)}&text=${encodeURIComponent(`Посмотри трату "${expense?.description}" в группе "${currentGroup.name}"!`)}`;

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

    if (!expense) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
                <DialogHeader className="flex flex-row items-center justify-between mt-2 mr-4">
                    <DialogTitle className="text-xl">{expense.description}</DialogTitle>
                    {isAuthor && (
                        <div className="flex gap-1 items-center">
                            <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Оплатил</p>
                            <p className="font-semibold">{getUserName(expense.payer_id)}</p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            {isEditing ? (
                                <div className="flex items-center gap-1 mt-1">
                                    <Input
                                        type="number"
                                        value={newAmount}
                                        onChange={e => setNewAmount(e.target.value)}
                                        className="w-24 h-8 text-right font-bold py-0 pr-1 pl-1"
                                        autoFocus
                                    />
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={handleUpdateAmount}>
                                        <Check className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:bg-gray-200" onClick={() => setIsEditing(false)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <p className="text-2xl font-bold">{expense.amount.toFixed(2)} ₽</p>
                                    {isAuthor && (
                                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-6 w-6 text-blue-500 hover:bg-blue-50">
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                            {!isEditing && <p className="text-xs text-muted-foreground">{format(new Date(expense.created_at), 'd MMM, HH:mm', { locale: ru })}</p>}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium">Кто платит:</h4>
                            {isAuthor && (
                                <Button variant="ghost" size="sm" onClick={() => {
                                    if (isEditingSplits) {
                                        updateExpenseSplits(expense.id, selectedSplitIds);
                                    }
                                    setIsEditingSplits(!isEditingSplits);
                                }} className="h-6 text-xs px-2 text-primary hover:bg-primary/10">
                                    {isEditingSplits ? 'Сохранить' : 'Изменить'}
                                </Button>
                            )}
                        </div>
                        {isEditingSplits ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    {members.map(member => {
                                        const isSelected = selectedSplitIds.includes(member.id);
                                        return (
                                            <div
                                                key={member.id}
                                                className={`flex items-center p-2 rounded-xl border transition cursor-pointer select-none ${isSelected ? 'bg-primary/5 border-primary/50' : 'bg-gray-50/50 border-gray-100'}`}
                                                onClick={() => setSelectedSplitIds(prev => prev.includes(member.id) ? prev.filter(id => id !== member.id) : [...prev, member.id])}
                                            >
                                                <Avatar className="size-6 mr-2">
                                                    <AvatarImage src={member.photo_url || ''} />
                                                    <AvatarFallback className="text-[10px] bg-gray-200">{member.first_name[0]}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs font-medium truncate flex-1">{getUserName(member.id)}</span>
                                                <div className={`ml-1 flex items-center justify-center size-4 rounded-full border ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 bg-white'}`}>
                                                    {isSelected && <Check className="w-2 h-2 text-white" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <Button variant="outline" size="sm" onClick={handleInvite} className="w-full text-xs h-8">
                                    <UserPlus className="w-3 h-3 mr-2" />
                                    Нет нужного? Пригласить по ссылке
                                </Button>
                            </div>
                        ) : (
                            <ul className="space-y-1 text-sm">
                                {expense.splits.map(split => (
                                    <li key={split.id} className="flex justify-between">
                                        <span>{getUserName(split.user_id)}</span>
                                        <span>{split.amount.toFixed(2)} ₽</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium">Комментарии</h4>
                        </div>

                        <div className="space-y-3 mb-4">
                            {loadingComments ? (
                                <p className="text-xs text-center text-muted-foreground">Загрузка...</p>
                            ) : comments.length === 0 ? (
                                <p className="text-xs text-center text-muted-foreground">Нет комментариев</p>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="bg-gray-50 p-2 rounded text-sm">
                                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                            <span className="font-semibold">{getUserName(comment.user_id)}</span>
                                            <span>{format(new Date(comment.created_at), 'HH:mm', { locale: ru })}</span>
                                        </div>
                                        <p>{comment.text}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mt-2 pt-2 border-t">
                    <Input
                        placeholder="Написать комментарий..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
