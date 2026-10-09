import { cn } from "cn"

/** Filled/empty stars for a 1–5 rating. */
export function Stars({
  rating,
  className,
}: {
  rating: number
  className?: string
}) {
  return (
    <span
      className={cn("inline-flex gap-0.5 text-(--color-accent)", className)}
      role="img"
      aria-label={`${rating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden className={n <= rating ? "" : "opacity-25"}>
          ★
        </span>
      ))}
    </span>
  )
}

/** Round profile picture, falling back to the person's initial. */
export function Avatar({
  name,
  src,
  className,
}: {
  name: string
  src?: string | null
  className?: string
}) {
  return (
    <span
      className={cn(
        "flex size-11 flex-none items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-[15px] text-neutral-700",
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        name.trim().charAt(0).toUpperCase()
      )}
    </span>
  )
}
