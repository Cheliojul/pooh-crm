// Etsy allows 10 requests/second. Server Actions run concurrently in one Node
// process, so the queue must be a single shared instance — if each action got
// its own, two concurrent analyses would each pace themselves correctly and
// still blow the combined limit. Hence `globalThis`, which also survives the
// module duplication that dev-mode HMR can cause.

const MIN_INTERVAL_MS = 125

interface ThrottleState {
  chain: Promise<unknown>
  lastStartedAt: number
}

const store = globalThis as typeof globalThis & {
  __etsyThrottle?: ThrottleState
}

function getState(): ThrottleState {
  store.__etsyThrottle ??= { chain: Promise.resolve(), lastStartedAt: 0 }
  return store.__etsyThrottle
}

const noop = () => {}

/** Runs `fn` after the previous call, never faster than one per 125 ms. */
export function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const state = getState()

  const run = state.chain.then(async () => {
    const wait = state.lastStartedAt + MIN_INTERVAL_MS - Date.now()
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait))
    }
    state.lastStartedAt = Date.now()
    return fn()
  })

  // The chain must never hold a rejection, or one failed request would reject
  // every request queued behind it.
  state.chain = run.then(noop, noop)

  return run
}
