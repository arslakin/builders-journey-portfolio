import type { PortfolioSectionId } from "../domain/navigation.ts";

export type SectionNavigationResult =
  | {
      readonly status: "navigated";
      readonly target: PortfolioSectionId;
    }
  | {
      readonly status: "missing-target";
      readonly target: PortfolioSectionId;
    };

/**
 * Performs local in-page navigation and leaves a safe typed result when a
 * required heading is missing. Native fragment links remain useful without JS.
 */
export function navigateToSection(
  targetId: PortfolioSectionId,
  prefersReducedMotion: boolean,
): SectionNavigationResult {
  const target = document.getElementById(targetId);

  if (!(target instanceof HTMLElement)) {
    return { status: "missing-target", target: targetId };
  }

  const hash = "#" + targetId;
  if (window.location.hash !== hash) {
    try {
      window.history.pushState(null, "", hash);
    } catch {
      // Navigation and focus still work when history mutation is unavailable.
    }
  }

  target.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
  target.focus({ preventScroll: true });

  return { status: "navigated", target: targetId };
}
