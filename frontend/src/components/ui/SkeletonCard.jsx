export default function SkeletonCard() {
  return (
    <div className="animate-pulse flex bg-surface border border-border rounded p-2 gap-2 mb-2.5">
      <div className="w-8 bg-surface-raised rounded shrink-0 h-20" />
      <div className="flex-1 flex flex-col gap-2 py-2">
        <div className="bg-surface-raised rounded w-[30%] h-3" />
        <div className="bg-surface-raised rounded w-[90%] h-[18px]" />
        <div className="bg-surface-raised rounded w-[60%] h-3" />
        <div className="bg-surface-raised rounded h-6 w-1/2 mt-2" />
      </div>
    </div>
  )
}
