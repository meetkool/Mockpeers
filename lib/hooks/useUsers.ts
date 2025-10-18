import { useQuery } from '@tanstack/react-query';

export interface User {
  id: string;
  name: string | null;
  email: string;
  profession: string | null;
  country: string | null;
  phoneNumber: string | null;
  isPhoneVerified: boolean;
  onboardingCompleted: boolean;
  provider: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    userMeetings: number;
  };
}

const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch('/api/admin/users');

  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  return response.json();
};

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000,  // 5 minutes
  });
}


