export interface User {
  id: string;
  email: string;
  username: string;
  subscription_status?: 'free' | 'active' | 'past_due' | 'canceled';
}

// Interface que faltava para a tabela 'businesses'
export interface Business {
  id: string;
  owner_id: string; // Importante: aqui é owner_id, não user_id
  name: string;
  slug: string;
  banner_url?: string;
  plan_type?: 'free' | 'pro' | 'business';
  subscription_status?: string;
  created_at: string;
}

export interface Service {
  id: string;
  user_id: string; // Se possível, migre para business_id no futuro
  name: string;
  category?: string;    
  description?: string; 
  duration_minutes: number;
  price?: number;
  is_active: boolean;
  created_at: string;
}

export interface AvailabilitySetting {
  id: string;
  business_id: string; // CORREÇÃO: Vincula à empresa, não ao usuário direto
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  created_at: string;
}

export interface Professional {
  id: string;
  user_id: string;
  name: string;
  capacity: number;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  user_id: string;
  client_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: Client;
  service?: Service;
  professional_id?: string;
  professionals?: Professional;
}

export interface BlockedClient {
  id: string;
  user_id: string;
  client_id: string;
  no_show_count: number;
  blocked_at: string;
  reason?: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  confirmation_message: string;
  reminder_24h_message: string;
  reminder_2h_message: string;
  send_confirmation: boolean;
  send_24h_reminder: boolean;
  send_2h_reminder: boolean;
  created_at: string;
  updated_at: string;
}