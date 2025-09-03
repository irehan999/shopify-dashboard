import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Using persist middleware to save auth state to localStorage.
// This way, the user remains logged in even after a page refresh.
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      // Action to set the user and authentication status upon successful login/registration.
      login: (userData) => set({ user: userData, isAuthenticated: true }),

      // Action to clear user state upon logout.
      logout: () => set({ user: null, isAuthenticated: false }),

      // Action to update user details (e.g., after a profile update).
      updateUser: (updatedUserData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUserData } : null,
        })),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);

export default useAuthStore;
