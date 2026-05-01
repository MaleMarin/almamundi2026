import type { CanonicalStoryStatus } from "@/lib/editorial/status";

export type EditorialModerationAction =
  | "submit"
  | "approve"
  | "reject"
  | "archive"
  | "feature"
  | "unpublish"
  | "mark_beta_demo";

/** Transiciones válidas sobre documentos `stories` en capa española pendiente→público. */
const SPANISH_PENDING_TO_APPROVED_FROM: readonly string[] = ["pending", "reviewing"];

export function canApproveSpanishDraft(current: string): boolean {
  return SPANISH_PENDING_TO_APPROVED_FROM.includes(current);
}

/** Transiciones de moderación Anglo panel admin (`stories`). */
export function nextStatusAfterAdminStoryAction(
  current: string,
  action: "approve" | "reject" | "feature" | "archive"
): CanonicalStoryStatus | null {
  if (action === "approve") {
    if (current === "pending") return "approved";
    return null;
  }
  if (action === "reject") {
    if (current === "pending") return "rejected";
    return null;
  }
  if (action === "feature") {
    if (current === "approved" || current === "published" || current === "active" || current === "featured") {
      return "featured";
    }
    return null;
  }
  if (action === "archive") {
    if (
      current === "approved" ||
      current === "featured" ||
      current === "beta_demo" ||
      current === "published" ||
      current === "active"
    ) {
      return "archived";
    }
    return null;
  }
  return null;
}
