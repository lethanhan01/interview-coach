export interface UserAccountResponse {
  id: string
  email: string
  firstname: string | null
  lastname: string | null
  role: string
  status: string
  createdAt: string
}

export interface UpdateUserAccountPayload {
  firstname?: string
  lastname?: string
}

export interface AdminUser {
  id: string
  email: string
  role: string
  status: string
  createdAt: string
  firstname?: string | null
  lastname?: string | null
}

export interface UpdateAdminUserPayload {
  role?: string
  status?: string
}
