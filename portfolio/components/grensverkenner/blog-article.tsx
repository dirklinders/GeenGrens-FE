import { cn } from "@/lib/utils"

interface BlogArticleProps {
  date: string
  title: string
  children: React.ReactNode
  className?: string
}

export function BlogArticle({ date, title, children, className }: BlogArticleProps) {
  return (
    <article className={cn("", className)}>
      <span className="text-xs font-semibold uppercase tracking-wider text-accent">
        {date}
      </span>
      <h2 className="mt-2 font-serif text-2xl font-bold leading-tight text-foreground md:text-3xl">
        {title}
      </h2>
      <div className="mt-6 space-y-4 font-serif text-base leading-relaxed text-foreground/90 md:text-lg">
        {children}
      </div>
    </article>
  )
}
