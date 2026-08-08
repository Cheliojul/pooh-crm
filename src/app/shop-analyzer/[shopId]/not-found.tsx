import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function ShopNotFound() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-12">
      <h1 className="text-page-title font-semibold">Shop not analyzed yet</h1>
      <p className="max-w-md text-body text-muted-foreground">
        Nothing is stored locally for that shop id. Analyze it from the shop analyzer
        page and it will appear here.
      </p>
      <Link href="/shop-analyzer" className={cn(buttonVariants())}>
        Back to Shop Analyzer
      </Link>
    </div>
  )
}
