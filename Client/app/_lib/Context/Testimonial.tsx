"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  createTestimonialDTO,
  Testimonial,
  type TestimonialContext,
  UpdateTestimonialDTO,
} from "../Types/Testimonial"

const TestimonialContext = createContext<TestimonialContext>({
  loading: false,
  testimonials: [],
  createTestimonial: () => Promise.resolve(),
  editTestimonial: () => Promise.resolve(),
  fetchTestimonials: () => Promise.resolve(),
  deleteTestimonial: () => Promise.resolve(),
})

export const useTestimonialContext = () => useContext(TestimonialContext)

export default function TestimonialContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]),
    [loading, setLoading] = useState(true)

  const fetchTestimonials = async () => {
    const fetchRequest = await fetch("/system/api/v1/testimonials", {
        method: "GET",
      }),
      fetchResponse = await fetchRequest.json()

    if (!fetchRequest.ok) throw new Error(fetchResponse.error)

    setTestimonials(fetchResponse)
  }

  useEffect(() => {
    fetchTestimonials()
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const createTestimonial = async (details: createTestimonialDTO) => {
      const createRequest = await fetch("/system/api/v1/testimonials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(details),
        }),
        createResponse = await createRequest.json()

      if (!createRequest.ok) throw new Error(createResponse.error)

      await fetchTestimonials()
    },
    editTestimonial = async (
      testimonialId: string,
      details: UpdateTestimonialDTO
    ) => {
      const editRequest = await fetch(
          `/system/api/v1/testimonials/${testimonialId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
          }
        ),
        editResponse = await editRequest.json()

      if (!editRequest.ok) throw new Error(editResponse.error)

      await fetchTestimonials()
    },
    deleteTestimonial = async (testimonialId: string) => {
      const deleteRequest = await fetch(
        `/system/api/v1/testimonials/${testimonialId}`,
        { method: "DELETE" }
      )

      // The backend returns 204 with no body on success — only the
      // error path has JSON to parse.
      if (!deleteRequest.ok) {
        const deleteResponse = await deleteRequest.json()
        throw new Error(deleteResponse.error)
      }

      await fetchTestimonials()
    }

  return (
    <TestimonialContext.Provider
      value={{
        loading,
        testimonials,
        createTestimonial,
        editTestimonial,
        fetchTestimonials,
        deleteTestimonial,
      }}
    >
      {children}
    </TestimonialContext.Provider>
  )
}
