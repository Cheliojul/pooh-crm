"use client"

import { useActionState } from "react"
import { LoaderCircle, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AnalyzeAction, AnalyzeState } from "@/lib/shop-types"

const INITIAL_STATE: AnalyzeState = { status: "idle" }

export interface ShopSearchFormProps {
  /**
   * The server action is passed in rather than imported. Importing it would pull
   * `node:fs` into this module's graph, which breaks Storybook's browser-mode
   * test runner.
   */
  analyzeAction: AnalyzeAction
}

export function ShopSearchForm({ analyzeAction }: ShopSearchFormProps) {
  const [state, formAction, pending] = useActionState(analyzeAction, INITIAL_STATE)

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          name="shopInput"
          type="text"
          autoComplete="off"
          placeholder="https://www.etsy.com/shop/CozyKnitsCo"
          aria-label="Etsy shop URL"
          aria-invalid={state.status === "error"}
          aria-describedby={state.status === "error" ? "shop-input-error" : undefined}
          disabled={pending}
          required
          className="sm:max-w-lg"
        />
        <Button type="submit" disabled={pending}>
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Search aria-hidden="true" />
          )}
          {pending ? "Analyzing…" : "Analyze"}
        </Button>
      </div>

      {state.status === "error" ? (
        <p id="shop-input-error" role="alert" className="text-caption text-destructive">
          {state.message}
        </p>
      ) : (
        <p className="text-caption text-muted-foreground">
          Paste a shop URL, a listing URL, or just the shop name. Re-analyzing a shop
          you already have adds a new snapshot rather than replacing it.
        </p>
      )}
    </form>
  )
}
