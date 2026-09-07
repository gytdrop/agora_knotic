/**
 * Cross-tab status channel for the demo.
 *
 * The war room and the customer-facing payment app run in separate tabs on the
 * same origin. When the operator authorizes remediation, the payment app must
 * flip red -> green immediately, with no reload.
 *
 * Two transports, deliberately:
 *   - BroadcastChannel delivers the instant push and leaves no residue.
 *   - localStorage persists the value, so a tab opened *later* still reads the
 *     correct state, and the `storage` event covers browsers without
 *     BroadcastChannel.
 *
 * Note the `storage` event never fires in the tab that performed the write —
 * only in other tabs. Publishers therefore notify themselves explicitly rather
 * than dispatching a synthetic `storage` event, which would fire in the wrong
 * tab and do nothing useful.
 */

export type AppStatus = 'CRITICAL' | 'RESOLVED';

const KEY = 'echosphere:app_status';
const CHANNEL = 'echosphere:demo';

type Listener = (status: AppStatus) => void;
const listeners = new Set<Listener>();

let channel: BroadcastChannel | null = null;
let wired = false;

function isStatus(value: unknown): value is AppStatus {
  return value === 'CRITICAL' || value === 'RESOLVED';
}

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL);
  return channel;
}

function emit(status: AppStatus) {
  listeners.forEach((fn) => fn(status));
}

/** Current status. Defaults to CRITICAL so a cold tab opens broken. */
export function readStatus(): AppStatus {
  if (typeof window === 'undefined') return 'CRITICAL';
  try {
    const raw = window.localStorage.getItem(KEY);
    return isStatus(raw) ? raw : 'CRITICAL';
  } catch {
    return 'CRITICAL';
  }
}

/** Publish a status to every tab, including this one. */
export function publishStatus(status: AppStatus): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, status);
  } catch {
    // Private mode / storage disabled: BroadcastChannel still carries the demo.
  }
  getChannel()?.postMessage({ status });
  emit(status); // the writing tab gets no storage event, so notify directly
}

/** Restore the broken state between takes. */
export function resetStatus(): void {
  publishStatus('CRITICAL');
}

/** Subscribe to status changes from any tab. Returns an unsubscribe function. */
export function subscribeStatus(listener: Listener): () => void {
  listeners.add(listener);

  if (!wired && typeof window !== 'undefined') {
    wired = true;

    const bc = getChannel();
    if (bc) {
      bc.onmessage = (event: MessageEvent) => {
        const next = (event.data as { status?: unknown })?.status;
        if (isStatus(next)) emit(next);
      };
    }

    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key !== KEY) return;
      if (isStatus(event.newValue)) emit(event.newValue);
    });
  }

  return () => {
    listeners.delete(listener);
  };
}
