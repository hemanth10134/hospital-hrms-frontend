import { STEP_THEMES } from '../stepTheme'

export function StepGuidePanel() {
  return (
    <aside className="flex w-72 shrink-0 flex-col gap-4">
      {Object.values(STEP_THEMES).map((step) => (
        <div key={step.stepNumber} className="rounded-lg p-4" style={{ backgroundColor: step.tintColor }}>
          <div className="mb-2 flex items-center gap-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: step.color }}
            >
              {step.stepNumber}
            </span>
            <h3 className="text-sm font-semibold" style={{ color: step.color }}>
              {step.title}
            </h3>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
            {step.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  )
}
