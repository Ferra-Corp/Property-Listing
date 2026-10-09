"use client"

import { use } from "react"
import { PageIn } from "../../../../_components/Admin/motion"
import { useTestimonialContext } from "../../../../_lib/Context/Testimonial"
import { TestimonialForm } from "../../_components/testimonial-form"

export default function AdminEditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params),
    { testimonials, loading } = useTestimonialContext(),
    testimonial = testimonials.find((t) => t.id === id)

  return (
    <PageIn>
      {testimonial ? (
        <TestimonialForm testimonial={testimonial} />
      ) : (
        <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-7">
          {loading ? "Loading…" : "Testimonial not found."}
        </div>
      )}
    </PageIn>
  )
}
