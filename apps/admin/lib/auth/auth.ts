export interface LoginCredentials {
  username?: string
  email?: string
  password: string
  remember?: boolean
}

export interface User {
  id: string
  username: string
  email: string
  name: string
  roleId: string
  roleName: string
}

export interface LoginResponse {
  status: number
  message: string
  data: {
    accessToken: string
    user: User
  }
}

export interface AuthError {
  error: string
  message: string
  status: number
  details?: Array<{
    msg: string
    param: string
    location: string
  }>
}

