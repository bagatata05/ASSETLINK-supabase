import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(undefined);
    const [authError, setAuthError] = useState(null);

    const buildUser = async (supabaseUser, retryCount = 0) => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

            if (error) {
                if (retryCount < 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return buildUser(supabaseUser, retryCount + 1);
                }
                console.error('[Auth] Profile fetch error:', error);
            }

            return {
                id: supabaseUser.id,
                uid: supabaseUser.id,
                email: supabaseUser.email,
                user_metadata: supabaseUser.user_metadata,
                ...(profile || { role: null })
            };
        } catch (err) {
            console.error('[Auth] buildUser exception:', err);
            return {
                id: supabaseUser.id,
                uid: supabaseUser.id,
                email: supabaseUser.email,
                role: null
            };
        }
    };

    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            try {
                console.log('[Auth] Getting initial session...');

                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('[Auth] getSession error:', error);
                    if (isMounted) setUser(null);
                    return;
                }

                if (!isMounted) return;

                if (session) {
                    // 🔥 SET BASIC USER IMMEDIATELY
                    setUser({
                        id: session.user.id,
                        uid: session.user.id,
                        email: session.user.email,
                        user_metadata: session.user.user_metadata,
                        role: 'loading'
                    });

                    // 🔥 LOAD PROFILE IN BACKGROUND
                    buildUser(session.user).then(fullUser => {
                        if (isMounted) setUser(fullUser);
                    });

                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error('[Auth] initAuth failed:', err);
                if (isMounted) setUser(null);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return;

                console.log('[Auth Event]', event);

                if (event === 'INITIAL_SESSION') return;

                if (session) {
                    // 🔥 SET BASIC USER FAST
                    setUser({
                        id: session.user.id,
                        uid: session.user.id,
                        email: session.user.email,
                        user_metadata: session.user.user_metadata,
                        role: 'loading'
                    });

                    // 🔥 LOAD PROFILE AFTER
                    buildUser(session.user).then(fullUser => {
                        if (isMounted) setUser(fullUser);
                    });

                } else {
                    setUser(null);
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const refreshProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const userObj = await buildUser(session.user);
                setUser(userObj);
            }
        } catch (error) {
            console.error('[Auth] refreshProfile failed:', error);
        }
    };

    const isLoadingAuth = user === undefined;
    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{
            user,
            currentUser: user,
            isAuthenticated,
            isLoadingAuth,
            authError,
            logout,
            refreshProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};