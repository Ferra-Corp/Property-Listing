export type Redirect = {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  hits: number;
  created_at: string;
};

export type createRedirectDTO = {
  from_path: string;
  to_path: string;
  status_code?: number;
};

export type UpdateRedirectDTO = Partial<createRedirectDTO>;

export interface RedirectRepository {
  createRedirect: (details: createRedirectDTO) => Promise<Redirect>;
  editRedirect: (id: string, details: UpdateRedirectDTO) => Promise<Redirect>;
  getRedirects: () => Promise<Redirect[]>;
  deleteRedirect: (id: string) => Promise<void>;
}

export interface RedirectService {
  createRedirect: (details: createRedirectDTO) => Promise<Redirect>;
  editRedirect: (id: string, details: UpdateRedirectDTO) => Promise<Redirect>;
  getRedirects: () => Promise<Redirect[]>;
  deleteRedirect: (id: string) => Promise<void>;
}
