"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

export default function ShopAnalyzerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 p-6">
      <h1 className="text-page-title font-semibold">Something went wrong</h1>
      <p className="text-body text-muted-foreground">
        The shop analyzer could not load. Your stored analyses are on disk under{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-caption">.data/</code> and
        were not affected.
      </p>
      {error.digest ? (
        <p className="text-caption text-muted-foreground">Digest: {error.digest}</p>
      ) : null}
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
