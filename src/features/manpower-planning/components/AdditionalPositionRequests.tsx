import { useMemo, useState } from 'react'
import type { Lookup, PositionRequest, PositionRequestDraft, PositionRequestStatus } from '../../../types/manpowerPlanning'
import { SectionCard } from '../../../components/SectionCard'
import { SearchableSelect } from '../../../components/SearchableSelect'
import { formatCurrency } from '../../../utils/formatters'
import { parseNumericInput } from '../../../utils/numberInput'
import { STEP_THEMES } from '../stepTheme'
import { CreateDesignationModal, type NewDesignationDraft } from './CreateDesignationModal'
import { PositionRequestDetailModal } from './PositionRequestDetailModal'

const STATUS_STYLES: Record<PositionRequestStatus, string> = {
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<PositionRequestStatus, string> = {
  PENDING_APPROVAL: 'Pending Approval',
  UNDER_REVIEW: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

type StatusFilter = 'ALL' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'

const OPEN_STATUSES = new Set<PositionRequestStatus>(['PENDING_APPROVAL', 'UNDER_REVIEW'])

const FORM_INPUT_CLASS =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-100'

export function emptyRequestDraft(requestedBy: string): PositionRequestDraft {
  return {
    clientKey: crypto.randomUUID(),
    designationId: '',
    requestedPositions: 1,
    currentStaff: 0,
    reason: '',
    additionalMonthlyBudget: 0,
    requestedBy,
  }
}

function isDraftComplete(draft: PositionRequestDraft) {
  return (
    draft.designationId !== '' &&
    draft.requestedPositions > 0 &&
    draft.reason.trim() !== '' &&
    draft.requestedBy.trim() !== ''
  )
}

interface AdditionalPositionRequestsProps {
  department: Lookup | null
  designationOptions: Lookup[]
  requests: PositionRequest[]
  drafts: PositionRequestDraft[]
  onDraftsChange: (drafts: PositionRequestDraft[]) => void
  currentStaffByDesignation: Record<string, number>
  defaultRequestedBy: string
  onCreate: (draft: PositionRequestDraft) => Promise<void>
  onStatusChange: (id: string, status: PositionRequestStatus) => Promise<void>
  onCreateDesignation?: (draft: NewDesignationDraft) => Promise<void>
  disabled?: boolean
}

export function AdditionalPositionRequests({
  department,
  designationOptions,
  requests,
  drafts,
  onDraftsChange,
  currentStaffByDesignation,
  defaultRequestedBy,
  onCreate,
  onStatusChange,
  onCreateDesignation,
  disabled,
}: AdditionalPositionRequestsProps) {
  const [submittingKey, setSubmittingKey] = useState<string | null>(null)
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({})
  const [isAddingDesignation, setIsAddingDesignation] = useState(false)
  const [isSavingDesignation, setIsSavingDesignation] = useState(false)
  const [designationError, setDesignationError] = useState<string | null>(null)
  const [viewingRequest, setViewingRequest] = useState<PositionRequest | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  const visibleRequests = useMemo(() => {
    if (statusFilter === 'ALL') return requests
    if (statusFilter === 'PENDING_APPROVAL') return requests.filter((request) => OPEN_STATUSES.has(request.status))
    return requests.filter((request) => request.status === statusFilter)
  }, [requests, statusFilter])

  const openRequestDesignationIds = requests
    .filter((request) => OPEN_STATUSES.has(request.status))
    .map((request) => request.designation.id)

  function updateDraft(index: number, patch: Partial<PositionRequestDraft>) {
    onDraftsChange(drafts.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)))
  }

  function selectDesignation(index: number, designationId: string) {
    const current = drafts[index]
    updateDraft(index, {
      designationId,
      currentStaff: currentStaffByDesignation[designationId] ?? current.currentStaff,
    })
  }

  function keepDrafts(remaining: PositionRequestDraft[]) {
    onDraftsChange(remaining.length > 0 ? remaining : [emptyRequestDraft(defaultRequestedBy)])
  }

  async function submit(toSubmit: PositionRequestDraft[]) {
    const submittedKeys = new Set<string>()
    const errors: Record<string, string> = {}
    for (const draft of toSubmit) {
      try {
        await onCreate(draft)
        submittedKeys.add(draft.clientKey)
      } catch (error) {
        errors[draft.clientKey] = error instanceof Error ? error.message : 'Failed to create position request.'
      }
    }
    setDraftErrors(errors)
    if (submittedKeys.size > 0) keepDrafts(drafts.filter((draft) => !submittedKeys.has(draft.clientKey)))
  }

  async function handleSubmit(draft: PositionRequestDraft) {
    setSubmittingKey(draft.clientKey)
    try {
      await submit([draft])
    } finally {
      setSubmittingKey(null)
    }
  }

  async function handleSubmitAll() {
    setSubmittingKey('ALL')
    try {
      await submit(drafts.filter(isDraftComplete))
    } finally {
      setSubmittingKey(null)
    }
  }

  const completeDraftCount = drafts.filter(isDraftComplete).length

  return (
    <SectionCard
      stepNumber={STEP_THEMES.positionRequests.stepNumber}
      color={STEP_THEMES.positionRequests.color}
      tintColor={STEP_THEMES.positionRequests.tintColor}
      title="Additional Position Requests"
      description="Non-planned positions. Raise a request below (or upload them from Module 1); each goes for approval."
      infoBullets={STEP_THEMES.positionRequests.bullets}
      actions={
        <>
          <select
            aria-label="Filter by status"
            className="app-select rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-600"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          {onCreateDesignation && (
            <button
              type="button"
              className="app-button rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:shadow-sm disabled:opacity-50"
              disabled={disabled}
              onClick={() => {
                setDesignationError(null)
                setIsAddingDesignation(true)
              }}
            >
              + Add Designation
            </button>
          )}
        </>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-sm">
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
              <tr key={request.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                <td className="py-2 pr-3 text-slate-500">{index + 1}</td>
                <td className="py-2 pr-3 font-medium text-slate-800">{request.designation.name}</td>
                <td className="py-2 pr-3">{request.currentStaff}</td>
                <td className="py-2 pr-3">{request.requestedPositions}</td>
                <td className="max-w-[220px] truncate py-2 pr-3" title={request.reason}>
                  {request.reason}
                </td>
                <td className="py-2 pr-3">{formatCurrency(request.additionalMonthlyBudget)}</td>
                <td className="py-2 pr-3">
                  {OPEN_STATUSES.has(request.status) ? (
                    <select
                      aria-label={`Status for ${request.designation.name} request`}
                      className="app-select rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"
                      value="PENDING_APPROVAL"
                      onChange={(event) => onStatusChange(request.id, event.target.value as PositionRequestStatus)}
                    >
                      <option value="PENDING_APPROVAL">Pending Approval</option>
                      <option value="APPROVED">Approve</option>
                      <option value="REJECTED">Reject</option>
                    </select>
                  ) : (
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[request.status]}`}>
                      {STATUS_LABELS[request.status]}
                    </span>
                  )}
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

      {!disabled && (
        <div className="mt-4 flex flex-col gap-3">
          {!department ? (
            <p className="rounded-lg border border-dashed border-pink-300 bg-white/70 p-3 text-sm text-slate-500">
              Select a hospital and department in step 1 to raise a request.
            </p>
          ) : (
            drafts.map((draft, index) => {
              const takenByOtherDrafts = drafts.filter((_, i) => i !== index).map((other) => other.designationId)
              return (
                <div key={draft.clientKey} className="rounded-lg border border-dashed border-pink-300 bg-white/70 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-pink-700">
                      New Position Request{drafts.length > 1 ? ` ${index + 1}` : ''}
                    </p>
                    {drafts.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Remove request ${index + 1}`}
                        className="text-xs text-slate-500 hover:text-red-600"
                        onClick={() => keepDrafts(drafts.filter((other) => other.clientKey !== draft.clientKey))}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
                    <div className="lg:col-span-2">
                      <SearchableSelect
                        label="Designation"
                        value={draft.designationId}
                        options={designationOptions}
                        placeholder="Select designation"
                        disabledOptionIds={[...openRequestDesignationIds, ...takenByOtherDrafts]}
                        onChange={(designationId) => selectDesignation(index, designationId)}
                      />
                    </div>
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium text-slate-600">Current Staff</span>
                      <input
                        type="number"
                        min={0}
                        className={FORM_INPUT_CLASS}
                        value={draft.currentStaff}
                        onChange={(event) => updateDraft(index, { currentStaff: parseNumericInput(event) })}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium text-slate-600">Requested Positions</span>
                      <input
                        type="number"
                        min={1}
                        className={FORM_INPUT_CLASS}
                        value={draft.requestedPositions}
                        onChange={(event) => updateDraft(index, { requestedPositions: parseNumericInput(event) })}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium text-slate-600">Additional Monthly Budget (₹)</span>
                      <input
                        type="number"
                        min={0}
                        className={FORM_INPUT_CLASS}
                        value={draft.additionalMonthlyBudget}
                        onChange={(event) => updateDraft(index, { additionalMonthlyBudget: parseNumericInput(event) })}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium text-slate-600">Requested By</span>
                      <input
                        type="text"
                        className={FORM_INPUT_CLASS}
                        value={draft.requestedBy}
                        onChange={(event) => updateDraft(index, { requestedBy: event.target.value })}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm sm:col-span-2 lg:col-span-5">
                      <span className="font-medium text-slate-600">Reason</span>
                      <input
                        type="text"
                        placeholder="Why are these extra positions needed?"
                        className={FORM_INPUT_CLASS}
                        value={draft.reason}
                        onChange={(event) => updateDraft(index, { reason: event.target.value })}
                      />
                    </label>
                    <button
                      type="button"
                      className="app-button h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                      disabled={!isDraftComplete(draft) || submittingKey !== null}
                      onClick={() => handleSubmit(draft)}
                    >
                      {submittingKey === draft.clientKey ? 'Submitting…' : 'Submit Request'}
                    </button>
                  </div>
                  {draftErrors[draft.clientKey] && <p className="mt-2 text-sm text-red-600">{draftErrors[draft.clientKey]}</p>}
                </div>
              )
            })
          )}
          {department && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                className="text-sm font-medium text-pink-700 hover:underline"
                onClick={() => onDraftsChange([...drafts, emptyRequestDraft(defaultRequestedBy)])}
              >
                + Add another request
              </button>
              {drafts.length > 1 && (
                <button
                  type="button"
                  className="app-button rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-pink-700 disabled:opacity-50"
                  disabled={completeDraftCount === 0 || submittingKey !== null}
                  onClick={handleSubmitAll}
                >
                  {submittingKey === 'ALL' ? 'Submitting…' : `Submit all complete (${completeDraftCount})`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {isAddingDesignation && onCreateDesignation && (
        <CreateDesignationModal
          existingCodes={designationOptions.map((option) => option.code.toUpperCase())}
          isSaving={isSavingDesignation}
          errorMessage={designationError}
          onCancel={() => setIsAddingDesignation(false)}
          onSave={async (newDesignation) => {
            setIsSavingDesignation(true)
            setDesignationError(null)
            try {
              await onCreateDesignation(newDesignation)
              setIsAddingDesignation(false)
            } catch (error) {
              setDesignationError(error instanceof Error ? error.message : 'Failed to create designation.')
            } finally {
              setIsSavingDesignation(false)
            }
          }}
        />
      )}

      {viewingRequest && (
        <PositionRequestDetailModal request={viewingRequest} onClose={() => setViewingRequest(null)} />
      )}
    </SectionCard>
  )
}
