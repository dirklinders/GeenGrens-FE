/**
 * Feature flags for the Muntonrecht game.
 *
 * Master switch for the AI-chat feature (verdachten ondervragen).
 * When `false`, every chat entry point is hidden — the "Gesprek" nav item in
 * the game header, the unlocked-location CTAs on the map (popups + location
 * list) and the unlock success CTA — and `/chat` redirects to the game shell.
 *
 * ZERO chat code is deleted: the `/chat` page, `chat-message.tsx`,
 * `character-selector.tsx` and all chat API functions stay intact, so flipping
 * this single flag to `true` restores the previous behaviour.
 */
export const FEATURE_CHAT_ENABLED = false;
