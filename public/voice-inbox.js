// Presence and signaling are polled separately. Retain offers/candidates briefly until
// both the current presence and the matching peer connection are available.
export function createVoiceInbox({
  ready,
  receive,
  onError,
  now = Date.now,
  ttl = 10000,
  limit = 100,
}) {
  let pending = [],
    running = null,
    generation = 0;
  function flush() {
    if (running) return running;
    const current = generation;
    running = (async () => {
      let progressed;
      do {
        progressed = false;
        for (const item of [...pending]) {
          if (current !== generation) return;
          const state = item.expires > now() ? ready(item.sender, item.payload) : 'drop';
          if (!state) continue;
          pending.splice(pending.indexOf(item), 1);
          progressed = true;
          if (state === 'drop') continue;
          try {
            await receive(item.sender, item.payload);
          } catch (error) {
            if (current === generation) onError?.(item.sender, error);
          }
        }
      } while (progressed && pending.length && current === generation);
    })().finally(() => {
      running = null;
    });
    return running;
  }
  return {
    push(sender, payload) {
      pending.push({ sender, payload, expires: now() + ttl });
      if (pending.length > limit) pending.splice(0, pending.length - limit);
    },
    flush,
    clear() {
      generation++;
      pending = [];
    },
    get size() {
      return pending.length;
    },
  };
}
