export interface UserProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
}

const currentUserProfile: UserProfile = {
  firstName: 'Max',
  lastName: 'Mustermann',
  email: 'max.mustermann@test.de'
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export async function initAuthentication (): Promise<void> {
}

export function isAuthenticated (): boolean {
  return true
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export async function login (): Promise<boolean> {
  return true
}

export async function getUserProfile (): Promise<UserProfile> {
  return currentUserProfile
}

export async function editUserProfile (): Promise<boolean> {
  return true
}
