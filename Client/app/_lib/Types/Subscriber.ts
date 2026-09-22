/** Mirrors the backend's grouping — the same one the homepage's subscribe
 * form and browse filters use (`PROPERTY_KIND_OPTIONS` in app/page.tsx). */
export type SubscriberInterest =
  | "go_down_warehouse"
  | "office"
  | "retail_showroom"
  | "yard_plot"
  | "residential"

export type Subscriber = {
  id: string
  email: string
  interest: SubscriberInterest
  resend_contact_id: string | null
  unsubscribed_at: string | null
  created_at: string
  updated_at: string
}

export type SubscribeDTO = {
  email: string
  interest: SubscriberInterest
}

export type UpdateSubscriberDTO = {
  interest?: SubscriberInterest
  unsubscribed?: boolean
}

export type SubscriberContext = {
  loading: boolean
  subscribers: Subscriber[]
  getSubscribers: () => Promise<void>
  createSubscriber: (details: SubscribeDTO) => Promise<void>
  editSubscriber: (id: string, details: UpdateSubscriberDTO) => Promise<void>
  deleteSubscriber: (id: string) => Promise<void>
}
