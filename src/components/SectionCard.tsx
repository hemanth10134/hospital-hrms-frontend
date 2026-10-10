import { useEffect, useRef, useState, type ReactNode } from 'react'

interface SectionCardProps {
  stepNumber: number
  color: string
  tintColor: string
  title: string
  description?: string
  actions?: ReactNode
  infoBullets?: string[]
  children: ReactNode
}

export function SectionCard({
  stepNumber,
  color,
  tintColor,
  title,
  description,
  actions,
  infoBullets,
  children,
}: SectionCardProps) {
  const [isAnimating, setIsAnimating] = useState(true)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)

  // The entrance animation's `opacity`/`transform` keyframes make this element a CSS
  // stacking context for as long as the animation class is applied (animation-fill-mode:
  // both holds the computed style indefinitely). That traps any absolutely-positioned
  // dropdown rendered inside this card behind later sibling cards. Dropping the class once
  // the animation finishes removes the stacking context so dropdowns stack correctly.
  function handleAnimationEnd() {
    setIsAnimating(false)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setIsInfoOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <section
      className={`app-card rounded-xl p-5 shadow-sm ${isAnimating ? 'animate-section-enter' : ''}`}
      style={{ backgroundColor: tintColor, animationDelay: `${(stepNumber - 1) * 60}ms` }}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              {stepNumber}
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-800">{title}</h2>
              {description && <p className="text-sm text-slate-500">{description}</p>}
            </div>
          </div>
          {infoBullets && infoBullets.length > 0 && (
            <div className="relative shrink-0" ref={infoRef}>
              <button
                type="button"
                aria-label={`About ${title}`}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600"
                onClick={() => setIsInfoOpen((open) => !open)}
              >
                i
              </button>
              {isInfoOpen && (
                <div
                  className="absolute right-0 z-20 mt-2 w-72 max-w-[85vw] rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
                  style={{ borderTopColor: color, borderTopWidth: 3 }}
                >
                  <h3 className="mb-2 text-sm font-semibold" style={{ color }}>
                    {title}
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
                    {infoBullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  )
}
