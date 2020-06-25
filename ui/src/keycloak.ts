/* eslint-disable prefer-promise-reject-errors */
// eslint-disable-next-line no-unused-vars
import Keycloak, { KeycloakError, KeycloakInitOptions, KeycloakInstance } from 'keycloak-js'
import axios, { AxiosInstance } from 'axios'

// =================================================================================================

const AUTH_DISABLED: boolean = process.env.VUE_APP_AUTH_DISABLED === 'true'

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

    keycloakAuth.onAuthSuccess = (...args) => {
      console.log('onAuthSuccess', args)
      loadKeycloakUserProfile()
    }
    keycloakAuth.onAuthError = (...args) => console.log('onAuthError', args)
    keycloakAuth.onAuthLogout = (...args) => console.log('onAuthLogout', args)
    keycloakAuth.onAuthRefreshSuccess = (...args) =>
      console.log('onAuthRefreshSuccess', args)
    keycloakAuth.onAuthRefreshError = (...args) => {
      console.log('onAuthRefreshError', args)
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

function useBearer (): Promise<string> {
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

export async function createAxios (serviceBaseUrl: string): Promise<AxiosInstance> {
  const baseHeaders = {
    'Content-Type': 'application/json'
  }

  if (AUTH_DISABLED) {
    return axios.create({
      baseURL: serviceBaseUrl,
      headers: baseHeaders
    })
  }

  const token = await useBearer().catch(error => {
    console.error('Unable to get keycloak token. Error: ' + error)
    return Promise.reject(error)
  })

  return axios.create({
    baseURL: serviceBaseUrl,
    headers: {
      ...baseHeaders,
      Authorization: 'Bearer ' + token
    }
  })
}

export function isAuthenticated (): boolean {
  if (!keycloak || keycloak.authenticated === undefined) {
    return false
  }

  return keycloak.authenticated
}
