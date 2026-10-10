import { useMemo, useState } from 'react'
import type { Lookup, PositionRequest } from '../../../types/manpowerPlanning'
import { SectionCard } from '../../../components/SectionCard'
import { formatCurrency } from '../../../utils/formatters'
import { STEP_THEMES } from '../stepTheme'
import { CreatePositionRequestModal, type PositionRequestDraft } from './CreatePositionRequestModal'
import { PositionRequestDetailModal } from './PositionRequestDetailModal'

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

type StatusFilter = 'ALL' | PositionRequest['status']

const OPEN_STATUSES = new Set<PositionRequest['status']>(['PENDING_APPROVAL', 'UNDER_REVIEW'])

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
  const [viewingRequest, setViewingRequest] = useState<PositionRequest | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  const visibleRequests = useMemo(
    () => (statusFilter === 'ALL' ? requests : requests.filter((request) => request.status === statusFilter)),
    [requests, statusFilter],
  )

  const disabledDesignationIds = requests
    .filter((request) => OPEN_STATUSES.has(request.status))
    .map((request) => request.designation.id)

  return (
    <SectionCard
      stepNumber={STEP_THEMES.positionRequests.stepNumber}
      color={STEP_THEMES.positionRequests.color}
      tintColor={STEP_THEMES.positionRequests.tintColor}
      title="Additional Position Requests"
      description='If you need to open positions beyond the planned requirement, create a new position request. These will go for approval.'
      infoBullets={STEP_THEMES.positionRequests.bullets}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="app-select rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-600"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button
            type="button"
            className="app-button rounded-md border border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50"
            disabled={disabled || !department}
            onClick={() => setIsCreating(true)}
          >
            + Create Position Request
          </button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Designation</th>
              <th className="py-2 pr-3">Current Staff</th>
              <th className="py-2 pr-3">Requested Positions</th>
              <th className="py-2 pr-3">Reason</th>
              <th className="py-2 pr-3">Additional Monthly Budget (₹)</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Requested By</th>
              <th className="py-2 pr-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleRequests.map((request, index) => (
              <tr
                key={request.id}
                className="animate-row-enter border-b border-slate-100 transition-colors hover:bg-slate-50"
              >
                <td className="py-2 pr-3 text-slate-500">{index + 1}</td>
                <td className="py-2 pr-3 font-medium text-slate-800">{request.designation.name}</td>
                <td className="py-2 pr-3">{request.currentStaff}</td>
                <td className="py-2 pr-3">{request.requestedPositions}</td>
                <td className="py-2 pr-3">{request.reason}</td>
                <td className="py-2 pr-3">{formatCurrency(request.additionalMonthlyBudget)}</td>
                <td className="py-2 pr-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold transition-colors ${STATUS_STYLES[request.status]}`}
                  >
                    {STATUS_LABELS[request.status]}
                  </span>
                </td>
                <td className="py-2 pr-3">{request.requestedBy}</td>
                <td className="py-2 pr-3">
                  <button
                    type="button"
                    className="app-button rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:shadow-sm"
                    onClick={() => setViewingRequest(request)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {visibleRequests.length === 0 && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-slate-400">
                  {requests.length === 0 ? 'No additional position requests yet.' : 'No requests match this status filter.'}
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
          disabledDesignationIds={disabledDesignationIds}
          onCancel={() => setIsCreating(false)}
          onSave={(draft) => {
            onCreate(draft)
            setIsCreating(false)
          }}
        />
      )}

      {viewingRequest && (
        <PositionRequestDetailModal request={viewingRequest} onClose={() => setViewingRequest(null)} />
      )}
    </SectionCard>
  )
}
