import { useState } from 'react'
import type { Lookup, PositionRequest } from '../../../types/manpowerPlanning'
import { SectionCard } from '../../../components/SectionCard'
import { formatCurrency } from '../../../utils/formatters'
import { CreatePositionRequestModal, type PositionRequestDraft } from './CreatePositionRequestModal'

const STATUS_STYLES: Record<PositionRequest['status'], string> = {
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<PositionRequest['status'], string> = {
  PENDING_APPROVAL: 'Pending Approval',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

interface AdditionalPositionRequestsProps {
  department: Lookup | null
  designationOptions: Lookup[]
  requests: PositionRequest[]
  onCreate: (draft: PositionRequestDraft) => void
  disabled?: boolean
}

export function AdditionalPositionRequests({
  department,
  designationOptions,
  requests,
  onCreate,
  disabled,
}: AdditionalPositionRequestsProps) {
  const [isCreating, setIsCreating] = useState(false)

  return (
    <SectionCard
      stepNumber={4}
      color="#db2777"
      title="Additional Position Requests"
      description='If you need to open positions beyond the planned requirement, create a new position request. These will go for approval.'
      actions={
        <button
          type="button"
          className="rounded-md border border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          disabled={disabled || !department}
          onClick={() => setIsCreating(true)}
        >
          + Create Position Request
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Designation</th>
              <th className="py-2 pr-3">Requested Positions</th>
              <th className="py-2 pr-3">Reason</th>
              <th className="py-2 pr-3">Additional Monthly Budget (₹)</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Requested By</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request, index) => (
              <tr key={request.id} className="border-b border-slate-100">
                <td className="py-2 pr-3 text-slate-500">{index + 1}</td>
                <td className="py-2 pr-3 font-medium text-slate-800">{request.designation.name}</td>
                <td className="py-2 pr-3">{request.requestedPositions}</td>
                <td className="py-2 pr-3">{request.reason}</td>
                <td className="py-2 pr-3">{formatCurrency(request.additionalMonthlyBudget)}</td>
                <td className="py-2 pr-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[request.status]}`}>
                    {STATUS_LABELS[request.status]}
                  </span>
                </td>
                <td className="py-2 pr-3">{request.requestedBy}</td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  No additional position requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isCreating && department && (
        <CreatePositionRequestModal
          department={department}
          designationOptions={designationOptions}
          onCancel={() => setIsCreating(false)}
          onSave={(draft) => {
            onCreate(draft)
            setIsCreating(false)
          }}
        />
      )}
    </SectionCard>
  )
}
