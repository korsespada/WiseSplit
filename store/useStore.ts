import { create } from 'zustand';
import { User, Group, Expense, Member, Split, Comment } from '@/types';
import { supabase } from '@/lib/supabase';

interface AppState {
    user: User | null;
    currentGroup: Group | null;
    members: Member[];
    expenses: Expense[];
    isLoading: boolean;

    userGroups: Group[];
    setUser: (user: User) => void;
    setGroup: (group: Group) => void;
    resetGroup: () => void;
    fetchUserGroups: (userId: number) => Promise<Group[]>;
    fetchGroupData: (groupId: string) => Promise<void>;
    deleteGroup: (groupId: string) => Promise<void>;
    addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'splits' | 'group_id'> & { splits: Omit<Split, 'id' | 'expense_id'>[] }) => Promise<void>;
    deleteExpense: (expenseId: string) => Promise<void>;
    updateExpenseAmount: (expenseId: string, newAmount: number) => Promise<void>;
    updateExpenseSplits: (expenseId: string, userIds: number[]) => Promise<void>;
    fetchComments: (expenseId: string) => Promise<Comment[]>;
    addComment: (expenseId: string, text: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    user: null,
    currentGroup: null,
    members: [],
    userGroups: [],
    expenses: [],
    isLoading: false,

    setUser: (user) => set({ user }),
    setGroup: (group) => set({ currentGroup: group }),
    resetGroup: () => set({ currentGroup: null }),

    fetchUserGroups: async (userId) => {
        const { data, error } = await supabase
            .from('group_members')
            .select(`
                groups (
                    *,
                    members:group_members(users(*))
                )
            `)
            .eq('user_id', userId)
            .order('joined_at', { ascending: false });

        if (error) {
            console.error('Error fetching user groups:', error);
            return [];
        }

        const groups = (data?.map((item: any) => item.groups) || []) as Group[];
        set({ userGroups: groups });
        return groups;
    },

    fetchGroupData: async (groupId) => {
        set({ isLoading: true, expenses: [], members: [] });
        try {
            const { data: group } = await supabase
                .from('groups')
                .select('*')
                .eq('id', groupId)
                .single();

            const { data: members } = await supabase
                .from('group_members')
                .select('users(*)')
                .eq('group_id', groupId);

            const { data: expenses } = await supabase
                .from('expenses')
                .select(`
          *,
          splits:splits(*)
        `)
                .eq('group_id', groupId)
                .order('created_at', { ascending: false });

            if (group) set({ currentGroup: group });
            // Map members correctly because `users(*)` returns nested object
            if (members) {
                const uniqueMembers = members.map((m: any) => m.users as Member);
                set({ members: uniqueMembers });
            }
            if (expenses) set({ expenses });

        } catch (error) {
            console.error('Error fetching group data:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    deleteGroup: async (groupId) => {
        set({ isLoading: true });
        try {
            const { error } = await supabase
                .from('groups')
                .delete()
                .eq('id', groupId);

            if (error) throw error;

            const { user } = get();
            if (user) {
                await get().fetchUserGroups(user.id);
            }
            set({ currentGroup: null, expenses: [], members: [] });
        } catch (error) {
            console.error('Error deleting group:', error);
            alert('Ошибка при удалении группы');
        } finally {
            set({ isLoading: false });
        }
    },

    addExpense: async (expenseData) => {
        const { currentGroup } = get();
        if (!currentGroup) return;

        // TODO: Implement optimistic update or better error handling
        try {
            // 1. Insert Expense
            const { data: expense, error: expError } = await supabase
                .from('expenses')
                .insert({
                    group_id: currentGroup.id,
                    payer_id: expenseData.payer_id,
                    description: expenseData.description,
                    amount: expenseData.amount,
                })
                .select()
                .single();

            if (expError) throw expError;

            // 2. Insert Splits
            const splitsWithExpenseId = expenseData.splits.map(s => ({
                ...s,
                expense_id: expense.id
            }));

            const { error: splitError } = await supabase
                .from('splits')
                .insert(splitsWithExpenseId);

            if (splitError) throw splitError;

            // Refresh data
            await get().fetchGroupData(currentGroup.id);
        } catch (e) {
            console.error(e);
        }
    },

    deleteExpense: async (expenseId) => {
        const { currentGroup } = get();
        if (!currentGroup) return;

        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', expenseId);

            if (error) throw error;
            await get().fetchGroupData(currentGroup.id);
        } catch (e) {
            console.error('Error deleting expense:', e);
            alert('Ошибка при удалении траты');
        }
    },

    updateExpenseAmount: async (expenseId, newAmount) => {
        const { currentGroup, expenses } = get();
        if (!currentGroup) return;

        try {
            const expense = expenses.find(e => e.id === expenseId);
            if (!expense) return;

            // 1. Update expense amount
            const { error: expError } = await supabase
                .from('expenses')
                .update({ amount: newAmount })
                .eq('id', expenseId);

            if (expError) throw expError;

            // 2. Update splits proportionally 
            const splitAmount = newAmount / expense.splits.length;

            for (const split of expense.splits) {
                const { error: splitError } = await supabase
                    .from('splits')
                    .update({ amount: splitAmount })
                    .eq('id', split.id);
                if (splitError) throw splitError;
            }

            await get().fetchGroupData(currentGroup.id);
        } catch (e) {
            console.error('Error updating expense:', e);
            alert('Ошибка при обновлении траты');
        }
    },

    updateExpenseSplits: async (expenseId, userIds) => {
        const { currentGroup, expenses } = get();
        if (!currentGroup || userIds.length === 0) return;

        try {
            const expense = expenses.find(e => e.id === expenseId);
            if (!expense) return;

            // 1. Delete all existing splits for this expense
            const { error: delError } = await supabase
                .from('splits')
                .delete()
                .eq('expense_id', expenseId);
            if (delError) throw delError;

            // 2. Insert new splits
            const splitAmount = expense.amount / userIds.length;
            const newSplits = userIds.map(id => ({
                expense_id: expenseId,
                user_id: id,
                amount: splitAmount,
                is_paid: false
            }));

            const { error: insError } = await supabase
                .from('splits')
                .insert(newSplits);
            if (insError) throw insError;

            await get().fetchGroupData(currentGroup.id);
        } catch (e) {
            console.error('Error updating splits:', e);
            alert('Ошибка при обновлении участников траты');
        }
    },

    fetchComments: async (expenseId) => {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('expense_id', expenseId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching comments:', error);
            return [];
        }
        return data as Comment[];
    },

    addComment: async (expenseId, text) => {
        const { user } = get();
        if (!user) return;

        const { error } = await supabase
            .from('comments')
            .insert({
                expense_id: expenseId,
                user_id: user.id,
                text
            });

        if (error) {
            console.error('Error adding comment:', error);
        }
    },
}));
