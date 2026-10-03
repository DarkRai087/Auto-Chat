// ============================================================
// Twitch Auto-Claim Bonus (Channel Points) Content Script
// ============================================================
// Watches for the "Click to claim a bonus!" button and clicks it.

export default defineContentScript({
  matches: ['*://*.twitch.tv/*'],
  runAt: 'document_idle',

  main() {
    let enabled = false;

    // Load initial setting
    chrome.storage.local.get('twitchAutoClaimBonus', (result) => {
      enabled = result.twitchAutoClaimBonus === true;
    });

    // React to toggle changes from popup
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.twitchAutoClaimBonus) {
        enabled = changes.twitchAutoClaimBonus.newValue === true;
      }
    });

    let lastClaimTime = 0;

    // MutationObserver to detect bonus button appearing
    const observer = new MutationObserver(() => {
      if (!enabled) return;
      // Twitch bonus claim button
      const element = document.querySelector<HTMLElement>(
        'button[aria-label="Claim Bonus"], [aria-label="Claim Bonus"], button[aria-label="Claim bonus"], [aria-label="Claim bonus"], .claimable-bonus__icon, [aria-label="Click to claim a bonus!"]'
      );
      if (element) {
        const btn = element.closest('button') || element;
        const now = Date.now();
        // Prevent clicking more than once every 5 seconds to avoid multiple increments for the same button
        if (now - lastClaimTime > 5000) {
          btn.click();
          lastClaimTime = now;

          // Increment counter
          chrome.storage.local.get({ twitchBonusClaimCount: 0 }, (result) => {
            const currentCount = result.twitchBonusClaimCount as number;
            chrome.storage.local.set({ twitchBonusClaimCount: currentCount + 1 });
          });
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  },
});
