/* eslint-disable prefer-promise-reject-errors */
// eslint-disable-next-line no-unused-vars
import Keycloak, { KeycloakError, KeycloakInitOptions, KeycloakInstance } from 'keycloak-js'

// =================================================================================================

let keycloak: KeycloakInstance | undefined

// =================================================================================================

const options: KeycloakInitOptions = {
  onLoad: 'check-sso',
  checkLoginIframe: false
}

export function loadKeycloakUserProfile (): Promise<Keycloak.KeycloakProfile> {
  return new Promise((resolve, reject) => {
    if (keycloak) {
      keycloak.loadUserProfile()
        .success(profile => resolve(profile))
        .error(error => reject(error))
    } else {
      reject('Keycloak is not initiated!')
    }
  })
}

export function keycloakInit (
  keycloakURL: string
): Promise<KeycloakInstance> {
  const constructorOptions = {
    url: keycloakURL,
    realm: 'ods-userservice',
    clientId: 'ods-webclient'
  }
  return new Promise((resolve, reject) => {
    const keycloakAuth = (keycloak = Keycloak(constructorOptions))
    function init (): void {
      keycloakAuth
        .init(options)
        .success(authenticated => {
          console.log('Keycloak initialization successful:', authenticated)
          resolve(keycloakAuth)
        })
        .error((errorData: KeycloakError) => {
          console.error('Error during Keycloak initialization:', errorData)
          reject(errorData)
        })
    }

    keycloakAuth.onAuthSuccess = () => {
      console.log('onAuthSuccess', arguments)
      loadKeycloakUserProfile()
    }
    keycloakAuth.onAuthError = () => console.log('onAuthError', arguments)
    keycloakAuth.onAuthLogout = () => console.log('onAuthLogout', arguments)
    keycloakAuth.onAuthRefreshSuccess = () =>
      console.log('onAuthRefreshSuccess', arguments)
    keycloakAuth.onAuthRefreshError = () => {
      console.log('onAuthRefreshError', arguments)
      init()
    }
    init()
  })
}

export function keycloakLogin (): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    if (keycloak) {
      const keycloakAuth = keycloak
      keycloakAuth
        .login()
        .success(() => {
          console.log('login successful')
          resolve(true)
        })
        .error(() => {
          console.error('login failed')
          reject(false)
        })
    } else {
      console.error('login failed: keycloak undefined')
      reject(false)
    }
  })
}

export function keycloakEditProfile (): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    if (keycloak) {
      const keycloakAuth = keycloak
      keycloakAuth
        .accountManagement()
        .success(() => {
          console.log('edit profile successful')
          resolve(true)
        })
        .error(() => {
          console.error('edit profile failed')
          reject(false)
        })
    } else {
      console.error('edit profile failed: keycloak undefined')
      reject(false)
    }
  })
}

export function editKeycloakUserProfile (): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    if (keycloak) {
      const keycloakAuth = keycloak
      keycloakAuth
        .accountManagement()
        .success(() => {
          console.log('edit profile redirect successful')
          resolve(true)
        })
        .error(() => {
          console.error('edit profile failed')
          reject(false)
        })
    } else {
      console.error('edit profile error: keycloak undefined')
      reject(false)
    }
  })
}

export function useBearer (): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (keycloak && keycloak.token) {
      const keycloakAuth = keycloak
      keycloakAuth
        .updateToken(5)
        .success(() => {
          resolve(keycloakAuth.token)
        })
        .error(() => {
          reject('Failed to refresh token')
        })
    } else {
      reject('Not logged in')
    }
  })
}

export function isAuthenticated (): boolean {
  if (!keycloak || keycloak.authenticated === undefined) {
    return false
  }

  return keycloak.authenticated
}
