"use client"

import { useActionState } from "react"
import { LoaderCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { AnalyzeAction, AnalyzeState } from "@/lib/shop-types"

const INITIAL_STATE: AnalyzeState = { status: "idle" }

export interface ReAnalyzeButtonProps {
  shopId: number
  /** Same action the search form uses — see ShopSearchFormProps for why it is a prop. */
  analyzeAction: AnalyzeAction
}

export function ReAnalyzeButton({ shopId, analyzeAction }: ReAnalyzeButtonProps) {
  const [state, formAction, pending] = useActionState(analyzeAction, INITIAL_STATE)

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="shopInput" value={shopId} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw aria-hidden="true" />
        )}
        {pending ? "Capturing…" : "Re-analyze"}
      </Button>
      {state.status === "error" ? (
        <p role="alert" className="text-caption text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
