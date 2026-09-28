import type { ReactNode } from 'react'

interface SectionCardProps {
  stepNumber: number
  color: string
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function SectionCard({ stepNumber, color, title, description, actions, children }: SectionCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {stepNumber}
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-800">{title}</h2>
            {description && <p className="text-sm text-slate-500">{description}</p>}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}
