import { cn } from "@/lib/utils"

interface ImageBoxProps {
  caption: string
  large?: boolean
  className?: string
}

export function ImageBox({ caption, large = false, className }: ImageBoxProps) {
  return (
    <figure
      className={cn(
        "my-8 overflow-hidden rounded-lg border border-border bg-secondary",
        large ? "aspect-video" : "aspect-[4/3]",
        className
      )}
    >
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          <svg
            className="mx-auto h-12 w-12 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>
      <figcaption className="border-t border-border bg-card px-4 py-3 text-center text-sm italic text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  )
}
