"use client"

import { PageIn } from "../../_components/Admin/motion"
import { useUserContext } from "../../_lib/Context/User"
import { useAgentContext } from "../../_lib/Context/Agent"
import { StaffForm } from "../agents/_components/staff-form"

export default function AdminMyProfilePage() {
  const { currentUser, loading } = useUserContext(),
    { agents } = useAgentContext()

  const agent = currentUser
    ? agents.find((a) => a.user_id === currentUser.id)
    : undefined

  return (
    <PageIn>
      {currentUser ? (
        <StaffForm user={currentUser} agent={agent} variant="self" />
      ) : (
        <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-7">
          {loading ? "Loading…" : "Couldn't load your profile — try signing in again."}
        </div>
      )}
    </PageIn>
  )
}
