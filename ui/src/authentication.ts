export interface UserProfile {
  firstName?: string
  lastName?: string
  email?: string
}

const currentUserProfile: UserProfile = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test.user@value-ods.com'
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export async function initAuthentication (): Promise<void> {
}

export function isAuthenticated (): boolean {
  return true
}

export async function login (): Promise<boolean> {
  return true
}

export async function getUserProfile (): Promise<UserProfile> {
  return currentUserProfile
}

export async function editUserProfile (): Promise<boolean> {
  return true
}
