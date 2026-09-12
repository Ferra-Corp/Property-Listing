export type Service = {
  id: string
  slug: string
  title: string
  summary: string | null
  description: string | null
  icon: string | null
  image_url: string | null
  meta_title: string | null
  meta_description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type createServiceDTO = {
  slug: string
  title: string
  summary?: string | null
  description?: string | null
  icon?: string | null
  image_url?: string | null
  meta_title?: string | null
  meta_description?: string | null
  sort_order?: number
  is_active?: boolean
}

export type UpdateServiceDTO = Partial<createServiceDTO>

export type ServiceContext = {
  services: Service[]
  createService: (details: createServiceDTO) => Promise<void>
  editService: (id: string, details: UpdateServiceDTO) => Promise<void>
  fetchService: (id: string) => Promise<Service | null>
  fetchServices: () => Promise<void>
  deleteService: (id: string) => Promise<void>
}
