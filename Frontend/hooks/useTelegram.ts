'use client'

import { findUserForLogin } from '@/lib/actions/user.actions';
import { IUser } from '@/lib/database/models/user.model';
import { DEV_INIT_DATA } from '@/lib/telegram/constants';
import { useState, useEffect } from 'react';

const useTelegram = () => {
    const [state, setState] = useState<{
        isLoggedIn: boolean;
        loading: boolean;
        telegramId: string | null;
        chatId: string | null;
        currentUser: IUser | null;
        initData: string | null;
    }>({
        isLoggedIn: false,
        loading: true,
        telegramId: null,
        chatId: null,
        currentUser: null,
        initData: null,
    });

    useEffect(() => {
        const initTelegram = async () => {
            try {
                let user: { id: number | string } | null = null;
                let chat: { id: number | string } | null = null;
                let initData: string | null = null;

                if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
                    const tg = (window as any).Telegram.WebApp;
                    tg.ready();
                    initData = tg.initData || null;
                    user = tg.initDataUnsafe?.user;
                    chat = tg.initDataUnsafe?.chat;
                }

                const allowDevAuth =
                    process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH === 'true' &&
                    (window.location.hostname === 'localhost' || window.location.hostname.startsWith('127.0.0.1'));

                if (!initData && allowDevAuth) {
                    initData = DEV_INIT_DATA;
                    user = { id: process.env.NEXT_PUBLIC_DEV_TELEGRAM_ID || '0' };
                    chat = { id: process.env.NEXT_PUBLIC_DEV_TELEGRAM_ID || '0' };
                }

                if (user && initData) {
                    const userFound = await findUserForLogin(initData);

                    if (userFound) {
                        setState({
                            isLoggedIn: true,
                            loading: false,
                            telegramId: String(user.id),
                            chatId: String(chat?.id || user.id),
                            currentUser: userFound,
                            initData,
                        });
                        return;
                    }

                    setState({
                        isLoggedIn: false,
                        loading: false,
                        telegramId: String(user.id),
                        chatId: String(chat?.id || user.id),
                        currentUser: null,
                        initData,
                    });
                }
            } catch (error) {
                console.error('Error initializing Telegram:', error);
            } finally {
                setState((prevState) => ({
                    ...prevState,
                    loading: false,
                }));
            }
        };

        initTelegram();
    }, []);

    return { state };
};

export default useTelegram;
