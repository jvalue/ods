export interface UserProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
}

const currentUserProfile: UserProfile = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test.user@value-ods.com',
};

export async function initAuthentication(): Promise<void> {}

export function isAuthenticated(): boolean {
  return true;
}

export async function login(): Promise<boolean> {
  return Promise.resolve(true);
}

export async function getUserProfile(): Promise<UserProfile> {
  return Promise.resolve(currentUserProfile);
}

export async function editUserProfile(): Promise<boolean> {
  return Promise.resolve(true);
}
