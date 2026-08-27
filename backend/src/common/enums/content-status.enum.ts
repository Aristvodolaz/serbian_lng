// Shared lifecycle status for all content entities (unit, lesson, exercise,
// word). Only PUBLISHED content is visible through the public API; the admin
// can stage content as DRAFT until it passes publish validation.
export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}
