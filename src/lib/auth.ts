export type AuthUser = { app_metadata?: { [key: string]: unknown } | null } | null | undefined

/** Pure role check: the owner is marked by JWT app_metadata.role === 'owner'. */
export function isOwner(user: AuthUser): boolean {
  return user?.app_metadata?.role === 'owner'
}
