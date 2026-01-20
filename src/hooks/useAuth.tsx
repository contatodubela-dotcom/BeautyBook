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
      // 1. Busca o vínculo com a empresa (business_members)
      const { data: memberData, error: memberError } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (memberError || !memberData) {
        // Se não encontrar, assume Free
        console.warn("Usuário sem empresa vinculada:", memberError);
        setUser({ ...currentUser, subscription_status: 'active', plan_type: 'free' });
        return;
      }

      // 2. Busca os dados da empresa (businesses)
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('plan_type, subscription_status')
        .eq('id', memberData.business_id)
        .maybeSingle();

      if (businessError) {
         console.warn("Erro ao buscar dados da empresa:", businessError);
         setUser({ ...currentUser, subscription_status: 'active', plan_type: 'free' });
      } else {
         setUser({ 
            ...currentUser, 
            subscription_status: businessData?.subscription_status || 'active', 
            plan_type: businessData?.plan_type || 'free' 
         });
      }

    } catch (err) {
      console.error("Erro fatal no useAuth:", err);
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
    localStorage.clear();
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