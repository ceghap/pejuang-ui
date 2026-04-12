import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null, // { id, name, role }
      isAuthenticated: false,
      
      // Used specifically for the 403 redirect logic
      requiresPasswordChange: false,
      pendingUserId: null,
      
      login: (token, user) => set({ 
        token, 
        user, 
        isAuthenticated: true,
        requiresPasswordChange: false,
        pendingUserId: null
      }),
      
      logout: () => set({ 
        token: null, 
        user: null, 
        isAuthenticated: false,
        requiresPasswordChange: false,
        pendingUserId: null
      }),

      forcePasswordChange: (userId) => set({
        requiresPasswordChange: true,
        pendingUserId: userId
      })
    }),
    {
      name: 'pejuang-auth-store', // name of item in localStorage
      // We only want to persist the token and user. We don't persist requiresPasswordChange
      // so if they refresh during a redirect they just go back to login.
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
