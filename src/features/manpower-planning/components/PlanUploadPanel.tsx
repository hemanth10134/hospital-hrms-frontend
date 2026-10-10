import { useState } from 'react'
import type { PlanUploadResult, UploadedPlanGroup } from '../planUpload'

interface PlanUploadPanelProps {
  result: PlanUploadResult
  appliedKey: string | null
  onApply: (group: UploadedPlanGroup) => void
  onDismiss: () => void
}

const VISIBLE_ERRORS = 6

export function PlanUploadPanel({ result, appliedKey, onApply, onDismiss }: PlanUploadPanelProps) {
  const [showAllErrors, setShowAllErrors] = useState(false)
  const applied = result.groups.find((group) => group.key === appliedKey)
  const errors = showAllErrors ? result.errors : result.errors.slice(0, VISIBLE_ERRORS)

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-blue-200 bg-white p-3 text-sm" role="status">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-slate-800">
          Excel upload — {result.groups.length} department{result.groups.length === 1 ? '' : 's'} found
          {result.errors.length > 0 && `, ${result.errors.length} row issue${result.errors.length === 1 ? '' : 's'}`}
        </p>
        <button type="button" aria-label="Dismiss upload summary" className="text-slate-400 hover:text-slate-600" onClick={onDismiss}>
          ✕
        </button>
      </div>

      {applied && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-800">
          ✓ Loaded <strong>{applied.label}</strong>: {applied.lines.length} planned designation
          {applied.lines.length === 1 ? '' : 's'} (step 3) and {applied.requests.length} non-planned request
          {applied.requests.length === 1 ? '' : 's'} (step 4). Pick the planning period if needed, review, then Save.
        </p>
      )}

      {result.groups.length > 1 && (
        <div>
          <p className="mb-2 text-slate-600">This file covers several departments — choose which one to load:</p>
          <div className="flex flex-wrap gap-2">
            {result.groups.map((group) => (
              <button
                key={group.key}
                type="button"
                className={`app-button rounded-full border px-3 py-1.5 text-xs font-medium ${
                  group.key === appliedKey
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700'
                }`}
                onClick={() => onApply(group)}
              >
                {group.label} · {group.lines.length + group.requests.length} row{group.lines.length + group.requests.length === 1 ? '' : 's'}
              </button>
            ))}
          </div>
        </div>
      )}

      {result.errors.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <p className="mb-1 font-semibold">These rows were skipped or adjusted:</p>
          <ul className="list-disc space-y-0.5 pl-4">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
          {result.errors.length > VISIBLE_ERRORS && (
            <button type="button" className="mt-1 font-medium underline" onClick={() => setShowAllErrors((value) => !value)}>
              {showAllErrors ? 'Show fewer' : `Show all ${result.errors.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
