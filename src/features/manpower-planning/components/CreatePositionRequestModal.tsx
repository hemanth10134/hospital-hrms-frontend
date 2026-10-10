import { useState } from 'react'
import type { Lookup } from '../../../types/manpowerPlanning'
import { ModalShell } from '../../../components/ModalShell'
import { SearchableSelect } from '../../../components/SearchableSelect'
import { parseNumericInput } from '../../../utils/numberInput'

export interface PositionRequestDraft {
  designationId: string
  requestedPositions: number
  currentStaff: number
  reason: string
  additionalMonthlyBudget: number
  requestedBy: string
}

interface CreatePositionRequestModalProps {
  department: Lookup
  designationOptions: Lookup[]
  disabledDesignationIds: string[]
  onCancel: () => void
  onSave: (draft: PositionRequestDraft) => void
}

const INPUT_CLASS =
  'rounded-md border border-slate-300 px-3 py-2 transition-shadow focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500'

export function CreatePositionRequestModal({
  department,
  designationOptions,
  disabledDesignationIds,
  onCancel,
  onSave,
}: CreatePositionRequestModalProps) {
  const [designationId, setDesignationId] = useState('')
  const [requestedPositions, setRequestedPositions] = useState(1)
  const [currentStaff, setCurrentStaff] = useState(0)
  const [reason, setReason] = useState('')
  const [additionalMonthlyBudget, setAdditionalMonthlyBudget] = useState(0)
  const [requestedBy, setRequestedBy] = useState('')

  const isDuplicate = designationId !== '' && disabledDesignationIds.includes(designationId)
  const isValid =
    designationId !== '' &&
    !isDuplicate &&
    requestedPositions > 0 &&
    reason.trim() !== '' &&
    requestedBy.trim() !== ''

  return (
    <ModalShell>
      <h3 className="mb-1 text-lg font-semibold text-slate-800">Create Position Request</h3>
      <p className="mb-4 text-sm text-slate-500">Department: {department.name}</p>

      <div className="flex flex-col gap-3">
        <SearchableSelect
          label="Designation"
          value={designationId}
          options={designationOptions}
          placeholder="Select designation"
          disabledOptionIds={disabledDesignationIds}
          onChange={setDesignationId}
        />
        {isDuplicate && (
          <p className="-mt-2 text-xs text-red-600">
            This designation already has an open position request for this department.
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Current Staff</span>
          <input
            type="number"
            min={0}
            className={INPUT_CLASS}
            value={currentStaff}
            onChange={(event) => setCurrentStaff(parseNumericInput(event))}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Requested Positions</span>
          <input
            type="number"
            min={1}
            className={INPUT_CLASS}
            value={requestedPositions}
            onChange={(event) => setRequestedPositions(parseNumericInput(event))}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Reason</span>
          <textarea
            className={INPUT_CLASS}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Additional Monthly Budget (₹)</span>
          <input
            type="number"
            min={0}
            className={INPUT_CLASS}
            value={additionalMonthlyBudget}
            onChange={(event) => setAdditionalMonthlyBudget(parseNumericInput(event))}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Requested By</span>
          <input
            type="text"
            className={INPUT_CLASS}
            value={requestedBy}
            onChange={(event) => setRequestedBy(event.target.value)}
          />
        </label>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          className="app-button rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="app-button rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 hover:shadow-md disabled:opacity-50"
          disabled={!isValid}
          onClick={() =>
            onSave({ designationId, requestedPositions, currentStaff, reason, additionalMonthlyBudget, requestedBy })
          }
        >
          Submit Request
        </button>
      </div>
    </ModalShell>
  )
}
