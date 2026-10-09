export type Testimonial = {
  id: string
  name: string
  quote: string
  rating: number
  company_name: string | null
  company_profile_image_url: string | null
  profile_picture: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type createTestimonialDTO = {
  name: string
  quote: string
  rating?: number
  company_name?: string | null
  company_profile_image_url?: string | null
  profile_picture?: string | null
  is_active?: boolean
}

export type UpdateTestimonialDTO = Partial<createTestimonialDTO>

export type TestimonialContext = {
  loading: boolean
  testimonials: Testimonial[]
  createTestimonial: (details: createTestimonialDTO) => Promise<void>
  editTestimonial: (id: string, details: UpdateTestimonialDTO) => Promise<void>
  fetchTestimonials: () => Promise<void>
  deleteTestimonial: (id: string) => Promise<void>
}
