"use client"

import { use } from "react"
import { PageIn } from "../../../../_components/Admin/motion"
import { useAgentContext } from "../../../../_lib/Context/Agent"
import { useUserContext } from "../../../../_lib/Context/User"
import { StaffForm } from "../../_components/staff-form"

export default function AdminEditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params),
    { agents, loading: agentsLoading } = useAgentContext(),
    { users, loading: usersLoading, currentUser } = useUserContext()

  // The row identifier is an agent's slug when they have a profile, or
  // their raw user id otherwise — see StaffRegister. Both lists need to be
  // in before "not found" is trustworthy, since which one resolves it
  // depends on whether they turn out to be an agent at all.
  const agent = agents.find((a) => a.slug === id),
    user = agent
      ? users.find((u) => u.id === agent.user_id)
      : users.find((u) => u.id === id)

  // Reaching your own record through this id-addressed route (rather than
  // My Profile) shouldn't unlock a Role/Account-enabled view of yourself —
  // StaffForm's "self" restrictions apply the moment the id resolves to
  // whoever is signed in, not just when the My Profile page renders it.
  const isSelf = !!currentUser && currentUser.id === user?.id

  return (
    <PageIn>
      {user ? (
        <StaffForm
          user={user}
          agent={agent}
          variant={isSelf ? "self" : "admin"}
        />
      ) : (
        <div className="px-4 py-10 text-center text-[13.5px] text-neutral-600 md:px-7">
          {agentsLoading || usersLoading
            ? "Loading…"
            : `Staff member "${id}" not found.`}
        </div>
      )}
    </PageIn>
  )
}
