import { useState } from 'react'
import type { Lookup } from '../../../types/manpowerPlanning'

export interface PositionRequestDraft {
  designationId: string
  requestedPositions: number
  reason: string
  additionalMonthlyBudget: number
  requestedBy: string
}

interface CreatePositionRequestModalProps {
  department: Lookup
  designationOptions: Lookup[]
  onCancel: () => void
  onSave: (draft: PositionRequestDraft) => void
}

export function CreatePositionRequestModal({
  department,
  designationOptions,
  onCancel,
  onSave,
}: CreatePositionRequestModalProps) {
  const [designationId, setDesignationId] = useState('')
  const [requestedPositions, setRequestedPositions] = useState(1)
  const [reason, setReason] = useState('')
  const [additionalMonthlyBudget, setAdditionalMonthlyBudget] = useState(0)
  const [requestedBy, setRequestedBy] = useState('')

  const isValid =
    designationId !== '' && requestedPositions > 0 && reason.trim() !== '' && requestedBy.trim() !== ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-1 text-lg font-semibold text-slate-800">Create Position Request</h3>
        <p className="mb-4 text-sm text-slate-500">Department: {department.name}</p>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Designation</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={designationId}
              onChange={(event) => setDesignationId(event.target.value)}
            >
              <option value="" disabled>
                Select designation
              </option>
              {designationOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Requested Positions</span>
            <input
              type="number"
              min={1}
              className="rounded-md border border-slate-300 px-3 py-2"
              value={requestedPositions}
              onChange={(event) => setRequestedPositions(Number(event.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Reason</span>
            <textarea
              className="rounded-md border border-slate-300 px-3 py-2"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Additional Monthly Budget (₹)</span>
            <input
              type="number"
              min={0}
              className="rounded-md border border-slate-300 px-3 py-2"
              value={additionalMonthlyBudget}
              onChange={(event) => setAdditionalMonthlyBudget(Number(event.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Requested By</span>
            <input
              type="text"
              className="rounded-md border border-slate-300 px-3 py-2"
              value={requestedBy}
              onChange={(event) => setRequestedBy(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="rounded-md border border-slate-300 px-4 py-2 text-sm" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={!isValid}
            onClick={() =>
              onSave({ designationId, requestedPositions, reason, additionalMonthlyBudget, requestedBy })
            }
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  )
}
