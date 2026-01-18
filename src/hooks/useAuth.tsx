import { useContext, useState, useEffect, createContext } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface UserWithSubscription extends User {
  subscription_status?: string;
  plan_type?: string;
}

interface AuthContextType {
  session: Session | null;
  user: UserWithSubscription | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserWithSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserStatus = async (currentUser: User) => {
    try {
      // Timeout de segurança: Se o banco não responder em 5s, libera o acesso Free
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );

      // Busca dados reais no banco
      const dbPromise = supabase
        .from('business_members')
        .select(`
          business:businesses (
            plan_type,
            subscription_status
          )
        `)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      const { data, error } = await Promise.race([dbPromise, timeoutPromise]) as any;

      if (error && error.message !== 'Timeout') throw error;

      let plan = 'free';
      let status = 'active';

      if (data?.business) {
        const biz = Array.isArray(data.business) ? data.business[0] : data.business;
        plan = biz.plan_type || 'free';
        status = biz.subscription_status || 'active';
      }

      setUser({
        ...currentUser,
        subscription_status: status,
        plan_type: plan
      });

    } catch (err) {
      console.warn("Auth: Usando perfil fallback devido a erro ou timeout.", err);
      // Fallback seguro: Libera como Free para não travar o usuário
      setUser({ ...currentUser, subscription_status: 'active', plan_type: 'free' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Verifica sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        fetchUserStatus(session.user);
      } else {
        setLoading(false);
      }
    });

    // Ouve mudanças de login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      
      if (session?.user) {
        // Evita re-buscar se o usuário já estiver carregado
        setUser(prev => {
            if (prev?.id === session.user.id) return prev;
            fetchUserStatus(session.user);
            return prev; 
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};