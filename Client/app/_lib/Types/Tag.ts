/** `tags` has no timestamp columns at all — just id/name/slug. */
export type Tag = {
  id: string
  name: string
  slug: string
}

export type createTagDTO = {
  name: string
  slug: string
}

export type UpdateTagDTO = Partial<createTagDTO>

export type TagContext = {
  tags: Tag[]
  createTag: (details: createTagDTO) => Promise<void>
  editTag: (id: string, details: UpdateTagDTO) => Promise<void>
  fetchTag: (id: string) => Promise<Tag | null>
  fetchTags: () => Promise<void>
  deleteTag: (id: string) => Promise<void>
}
