export interface School {
  id: string;
  code: string;
  name: string;
  domain?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  currency: string;
  timezone: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  createdAt: string;
  updatedAt: string;
}
