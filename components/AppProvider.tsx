'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';


const AppContext = createContext<{ isLoading: boolean }>({ isLoading: true });

export const useApp = () => useContext(AppContext);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setGroup, fetchGroupData } = useStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initApp = async () => {
            let WebApp;
            try {
                WebApp = (await import('@twa-dev/sdk')).default;
            } catch (e) {
                console.error("Failed to load TWA SDK", e);
                return;
            }

            // 1. Check if running in Telegram
            if (typeof window !== 'undefined' && WebApp.initDataUnsafe?.user) {
                WebApp.ready();
                const tgUser = WebApp.initDataUnsafe.user;

                // Save user to Supabase if new
                const { error } = await supabase.from('users').upsert({
                    id: tgUser.id,
                    first_name: tgUser.first_name,
                    username: tgUser.username,
                    photo_url: tgUser.photo_url,
                });

                if (error) console.error("Error saving user:", error);

                setUser({
                    id: tgUser.id,
                    first_name: tgUser.first_name,
                    username: tgUser.username,
                    photo_url: tgUser.photo_url,
                });

                // 2. Check for start_param (Group ID)
                const startParam = WebApp.initDataUnsafe.start_param;
                if (startParam) {
                    // Attempt to join group automatically
                    await joinGroup(startParam, tgUser.id);
                }
            } else {
                // Fallback or Dev mode (Mock User)
                console.warn("Not in Telegram environment, using mock user for dev.");
                const mockUser = {
                    id: 12345,
                    first_name: "Dev User",
                    username: "devuser",
                };
                setUser(mockUser);
            }
            setIsLoading(false);
        };

        initApp();
    }, [setUser]);

    const joinGroup = async (groupId: string, userId: number) => {
        try {
            // Fetch group details
            const { data: group, error: groupError } = await supabase
                .from('groups')
                .select('*')
                .eq('id', groupId)
                .single();

            if (groupError || !group) {
                console.error("Group not found", groupError);
                return;
            }

            // Add user to group_members if not present
            const { error: memberError } = await supabase
                .from('group_members')
                .upsert({ group_id: groupId, user_id: userId }, { onConflict: 'group_id, user_id' });

            if (memberError) console.error("Error joining group:", memberError);

            // Fetch full group data including expenses
            await fetchGroupData(groupId);
        } catch (e) {
            console.error("Failed to join group:", e);
        }
    };

    return (
        <AppContext.Provider value={{ isLoading }}>
            {children}
        </AppContext.Provider>
    );
}
