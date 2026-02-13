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
    addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'splits' | 'group_id'> & { splits: Omit<Split, 'id' | 'expense_id'>[] }) => Promise<void>;
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
            .select('groups(*)')
            .eq('user_id', userId);

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
