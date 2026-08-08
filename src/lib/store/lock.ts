// Server Actions run concurrently within a single Node process, and both the
// per-shop record and index.json are read-modify-write. Without serialisation,
// two analyses finishing at the same moment lose one of the writes.
//
// The map lives on `globalThis` because dev-mode HMR can instantiate a module
// twice — a module-scoped Map would then hand out two independent locks, which
// is the same as having none.

const store = globalThis as typeof globalThis & {
  __shopStoreLocks?: Map<string, Promise<unknown>>
}

function getLocks(): Map<string, Promise<unknown>> {
  store.__shopStoreLocks ??= new Map<string, Promise<unknown>>()
  return store.__shopStoreLocks
}

const noop = () => {}

export function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const locks = getLocks()
  const previous = locks.get(key) ?? Promise.resolve()

  // Run regardless of whether the previous holder resolved or rejected — one
  // failed write must not wedge the queue.
  const run = previous.then(fn, fn)
  const tail = run.then(noop, noop)
  locks.set(key, tail)

  void tail.then(() => {
    // Only clear if nothing else queued behind us in the meantime.
    if (locks.get(key) === tail) locks.delete(key)
  })

  return run
}
