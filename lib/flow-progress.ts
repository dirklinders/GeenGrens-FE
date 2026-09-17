/**
 * Session-local fallbacks for the post-login flow (intro → rules → game).
 *
 * The server-side flags (`GET /api/game/Status` → `introSeen` / `rulesSeen`)
 * are the source of truth. These local flags only kick in when the server
 * cannot persist the seen-markers — e.g. auth-bypass dev mode where the user
 * has no linked team and `POST MarkIntroSeen` fails — so the flow is still
 * testable end-to-end.
 */

export const INTRO_SEEN_KEY = 'muntonrecht.introSeen';
export const RULES_SEEN_KEY = 'muntonrecht.rulesSeen';

/** Records a flow step as "seen" for this browser session. */
export function markLocalFlowStep(key: string) {
  try {
    sessionStorage.setItem(key, '1');
  } catch {
    // sessionStorage unavailable (private mode) — server flags remain authoritative
  }
}

/** Returns whether a flow step was locally marked as seen this session. */
export function localFlowStepSeen(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}
