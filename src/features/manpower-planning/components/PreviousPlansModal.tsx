import type { ManpowerPlanListItem } from '../../../types/manpowerPlanning'
import { ModalShell } from '../../../components/ModalShell'

interface PreviousPlansModalProps {
  plans: ManpowerPlanListItem[]
  isLoading: boolean
  onSelect: (planId: string) => void
  onClose: () => void
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SUBMITTED: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
}

export function PreviousPlansModal({ plans, isLoading, onSelect, onClose }: PreviousPlansModalProps) {
  return (
    <ModalShell maxWidthClassName="max-w-lg">
      <h3 className="mb-4 text-lg font-semibold text-slate-800">Previous Plans</h3>

      {isLoading && <p className="text-sm text-slate-500">Loading previous plans…</p>}
      {!isLoading && plans.length === 0 && (
        <p className="text-sm text-slate-500">No previous plans found for this hospital and department.</p>
      )}

      <div className="flex flex-col gap-2">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            className="app-button flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
            onClick={() => onSelect(plan.id)}
          >
            <div>
              <p className="text-sm font-medium text-slate-800">{plan.planningPeriodLabel}</p>
              <p className="text-xs text-slate-500">Created by {plan.createdBy}</p>
            </div>
            <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[plan.status] ?? ''}`}>
              {plan.status}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          className="app-button rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </ModalShell>
  )
}
