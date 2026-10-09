export type Testimonial = {
  id: string;
  name: string;
  quote: string;
  rating: number;
  company_name: string | null;
  profile_picture: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type createTestimonialDTO = {
  name: string;
  quote: string;
  rating?: number;
  company_name?: string | null;
  profile_picture?: string | null;
  is_active?: boolean;
};

export type UpdateTestimonialDTO = Partial<createTestimonialDTO>;

export interface TestimonialRepository {
  createTestimonial: (details: createTestimonialDTO) => Promise<Testimonial>;
  editTestimonial: (
    id: string,
    details: UpdateTestimonialDTO,
  ) => Promise<Testimonial>;
  getTestimonial: (
    id: string,
    publicOnly?: boolean,
  ) => Promise<Testimonial | null>;
  getTestimonials: (publicOnly?: boolean) => Promise<Testimonial[]>;
  deleteTestimonial: (id: string) => Promise<void>;
}

export interface TestimonialService {
  createTestimonial: (details: createTestimonialDTO) => Promise<Testimonial>;
  editTestimonial: (
    id: string,
    details: UpdateTestimonialDTO,
  ) => Promise<Testimonial>;
  getTestimonial: (id: string, publicOnly?: boolean) => Promise<Testimonial>;
  getTestimonials: (publicOnly?: boolean) => Promise<Testimonial[]>;
  deleteTestimonial: (id: string) => Promise<void>;
}
