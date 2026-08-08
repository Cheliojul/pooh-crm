"use client"

import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export interface DeleteShopButtonProps {
  shopId: number
  shopName: string
  /** Server action, passed as a prop — see ShopSearchFormProps for why. */
  deleteAction: (formData: FormData) => Promise<void>
}

export function DeleteShopButton({
  shopId,
  shopName,
  deleteAction,
}: DeleteShopButtonProps) {
  return (
    <form
      action={deleteAction}
      onSubmit={(event) => {
        // Deleting throws away the snapshot history, which is the one thing here
        // that cannot be re-fetched from Etsy — it only exists because it was
        // captured over time.
        const confirmed = window.confirm(
          `Delete ${shopName} and its stored snapshot history? Sales velocity for this shop will have to be rebuilt from scratch.`
        )
        if (!confirmed) event.preventDefault()
      }}
    >
      <input type="hidden" name="shopId" value={shopId} />
      <Button type="submit" variant="ghost" size="sm">
        <Trash2 aria-hidden="true" />
        Delete
      </Button>
    </form>
  )
}
