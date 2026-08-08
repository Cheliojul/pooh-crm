import { AppHeader } from "@/components/app-header"
import { Separator } from "@/components/ui/separator"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader active="dashboard" />
      <Separator />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
