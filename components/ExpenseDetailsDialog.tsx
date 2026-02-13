'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Expense, Comment } from '@/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Send, UserPlus } from 'lucide-react';

interface ExpenseDetailsDialogProps {
    expense: Expense | null;
    open: boolean;
    onClose: () => void;
}

export function ExpenseDetailsDialog({ expense, open, onClose }: ExpenseDetailsDialogProps) {
    const { user, members, fetchComments, addComment, currentGroup } = useStore();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);

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

    const getUserName = (id: number) => {
        const member = members.find(m => m.id === id);
        return member ? (member.id === user?.id ? 'Вы' : member.first_name) : `Пользователь ${id}`;
    };

    const handleInvite = async () => {
        if (!currentGroup) return;
        const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'WiseSplitBot';
        // Deep link to expense could be better, but for now group invite
        const inviteLink = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${botUsername}/start?startapp=${currentGroup.id}`)}&text=${encodeURIComponent(`Посмотри трату "${expense?.description}" в группе "${currentGroup.name}"!`)}`;

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
                <DialogHeader>
                    <DialogTitle>{expense.description}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Оплатил</p>
                            <p className="font-semibold">{getUserName(expense.payer_id)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold">{expense.amount.toFixed(2)} ₽</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(expense.created_at), 'd MMM, HH:mm', { locale: ru })}</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium mb-2">Кто платит:</h4>
                        <ul className="space-y-1 text-sm">
                            {expense.splits.map(split => (
                                <li key={split.id} className="flex justify-between">
                                    <span>{getUserName(split.user_id)}</span>
                                    <span>{split.amount.toFixed(2)} ₽</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium">Комментарии</h4>
                            <Button variant="ghost" size="sm" onClick={handleInvite} className="h-6 text-xs px-2">
                                <UserPlus className="w-3 h-3 mr-1" />
                                Пригласить
                            </Button>
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
