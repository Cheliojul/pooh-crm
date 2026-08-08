export default function ShopAnalyzerLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="h-9 w-full max-w-lg rounded-md bg-muted" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-48 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
