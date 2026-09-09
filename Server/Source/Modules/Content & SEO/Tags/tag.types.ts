/** `tags` has no timestamp columns at all — just id/name/slug. */
export type Tag = {
  id: string;
  name: string;
  slug: string;
};

export type createTagDTO = {
  name: string;
  slug: string;
};

export type UpdateTagDTO = Partial<createTagDTO>;

export interface TagRepository {
  createTag: (details: createTagDTO) => Promise<Tag>;
  editTag: (id: string, details: UpdateTagDTO) => Promise<Tag>;
  getTag: (id: string) => Promise<Tag | null>;
  getTags: () => Promise<Tag[]>;
  deleteTag: (id: string) => Promise<void>;
}

export interface TagService {
  createTag: (details: createTagDTO) => Promise<Tag>;
  editTag: (id: string, details: UpdateTagDTO) => Promise<Tag>;
  getTag: (id: string) => Promise<Tag>;
  getTags: () => Promise<Tag[]>;
  deleteTag: (id: string) => Promise<void>;
}
