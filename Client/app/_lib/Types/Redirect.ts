export type Redirect = {
  id: string
  from_path: string
  to_path: string
  status_code: number
  hits: number
  created_at: string
}

export type createRedirectDTO = {
  from_path: string
  to_path: string
  status_code?: number
}

export type UpdateRedirectDTO = Partial<createRedirectDTO>

export type RedirectContext = {
  redirects: Redirect[]
  createRedirect: (details: createRedirectDTO) => Promise<void>
  editRedirect: (id: string, details: UpdateRedirectDTO) => Promise<void>
  getRedirects: () => Promise<void>
  deleteRedirect: (id: string) => Promise<void>
}
