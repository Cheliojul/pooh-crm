export default function ShopDetailLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-56 rounded-md bg-muted" />
        <div className="h-4 w-80 rounded-md bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => index).map((key) => (
          <div key={key} className="h-24 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-muted" />
      <div className="h-96 rounded-lg bg-muted" />
    </div>
  )
}
