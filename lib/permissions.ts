export type AdminRole = "super-admin" | "admin" | "moderator";

/** Paths that moderators are allowed to access */
const MODERATOR_ALLOWED_PREFIXES = ["/places", "/reviews", "/blog"];

/**
 * Returns true if the given role can access the given pathname.
 * Super-admin and admin have unrestricted access.
 * Moderators are limited to content-moderation routes.
 */
export function canAccessPath(role: string | undefined, pathname: string): boolean {
  if (!role) return false;
  if (role === "super-admin" || role === "admin") return true;
  if (role === "moderator") {
    if (pathname === "/") return true;
    return MODERATOR_ALLOWED_PREFIXES.some((prefix) =>
      pathname === prefix || pathname.startsWith(prefix + "/")
    );
  }
  return false;
}

export function isSuperAdmin(role: string | undefined): boolean {
  return role === "super-admin";
}

export function isAdmin(role: string | undefined): boolean {
  return role === "admin" || role === "super-admin";
}

export function isModerator(role: string | undefined): boolean {
  return role === "moderator";
}

/** True for any staff role (super-admin, admin, or moderator) */
export function isStaff(role: string | undefined): boolean {
  return role === "super-admin" || role === "admin" || role === "moderator";
}

/** True if the role can manage users (activate/deactivate/assign roles) */
export function canManageUsers(role: string | undefined): boolean {
  return role === "super-admin";
}

/** True if the role can delete content (places, reviews, blogs) */
export function canDelete(role: string | undefined): boolean {
  return role === "super-admin" || role === "admin";
}

/** True if the role can edit/update blog posts */
export function canEditBlogs(role: string | undefined): boolean {
  return role === "super-admin" || role === "admin";
}

/** True if the role can view and manage contact requests */
export function canManageContact(role: string | undefined): boolean {
  return role === "super-admin" || role === "admin";
}
