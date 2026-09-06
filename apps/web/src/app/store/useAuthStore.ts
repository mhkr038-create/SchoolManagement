import { create } from 'zustand';
import { User, School } from '@school/types';

interface AuthState {
  user: User | null;
  school: School | null;
  availableSchools: School[];
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, school: School, accessToken: string, availableSchools?: School[]) => void;
  setAccessToken: (accessToken: string) => void;
  setAvailableSchools: (schools: School[]) => void;
  switchSchool: (school: School) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  hasPermission: (permissionCode: string) => boolean;
  hasRole: (roleName: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('auth_user') || 'null'),
  school: JSON.parse(localStorage.getItem('auth_school') || 'null'),
  availableSchools: JSON.parse(localStorage.getItem('auth_available_schools') || '[]'),
  accessToken: localStorage.getItem('auth_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'),
  isLoading: false,

  setAuth: (user, school, accessToken, availableSchools = []) => {
    const schoolsList = availableSchools.length > 0 ? availableSchools : [school];
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('auth_school', JSON.stringify(school));
    localStorage.setItem('auth_available_schools', JSON.stringify(schoolsList));
    localStorage.setItem('auth_token', accessToken);
    set({ user, school, availableSchools: schoolsList, accessToken, isAuthenticated: true });
  },

  setAccessToken: (accessToken) => {
    localStorage.setItem('auth_token', accessToken);
    set({ accessToken, isAuthenticated: true });
  },

  setAvailableSchools: (availableSchools) => {
    localStorage.setItem('auth_available_schools', JSON.stringify(availableSchools));
    set({ availableSchools });
  },

  switchSchool: (newSchool) => {
    localStorage.setItem('auth_school', JSON.stringify(newSchool));
    set({ school: newSchool });
  },

  updateUser: (updatedFields) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const newUser = { ...currentUser, ...updatedFields } as User;
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    set({ user: newUser });
  },

  logout: () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_school');
    localStorage.removeItem('auth_available_schools');
    localStorage.removeItem('auth_token');
    set({ user: null, school: null, availableSchools: [], accessToken: null, isAuthenticated: false });
  },

  hasPermission: (permissionCode: string) => {
    const { user } = get();
    if (!user) return false;
    const roleNames = user.roles?.map((r) => (typeof r === 'string' ? r : r.name)) || [];
    if (user.userType === 'SUPER_ADMIN' || roleNames.includes('SUPER_ADMIN')) {
      return true;
    }
    return user.permissions?.includes(permissionCode) || false;
  },

  hasRole: (roleName: string) => {
    const { user } = get();
    if (!user) return false;
    const roleNames = user.roles?.map((r) => (typeof r === 'string' ? r : r.name)) || [];
    return roleNames.includes(roleName) || user.userType === roleName;
  }
}));
