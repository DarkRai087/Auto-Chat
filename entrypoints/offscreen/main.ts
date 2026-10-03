// ============================================================
// Offscreen Document — Reliable Timer
// ============================================================
// This runs in a persistent offscreen document, not the service worker.
// It maintains accurate countdown timing via setInterval.

let timerId: ReturnType<typeof setInterval> | null = null;
let countdown = 0;

chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
  // SECURITY: Only accept messages from our own extension
  if (sender.id !== chrome.runtime.id) return;

  if (message.type === 'TIMER_START') {
    stopTimer();
    countdown = message.payload.delaySeconds;
    startTimer();
  } else if (message.type === 'TIMER_STOP') {
    stopTimer();
  }
});

function startTimer() {
  timerId = setInterval(() => {
    countdown--;

    const shouldSend = countdown <= 0;

    chrome.runtime.sendMessage({
      type: 'TIMER_TICK',
      payload: {
        countdown: Math.max(0, countdown),
        shouldSend,
      },
    });

    // Reset countdown will be handled by background sending TIMER_START again
    if (shouldSend) {
      stopTimer();
    }
  }, 1000);
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}
