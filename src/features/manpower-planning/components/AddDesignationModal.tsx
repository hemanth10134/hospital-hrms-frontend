import { useState } from 'react'
import type { DesignationLine, Lookup } from '../../../types/manpowerPlanning'

interface AddDesignationModalProps {
  designationOptions: Lookup[]
  initialValue?: DesignationLine
  onCancel: () => void
  onSave: (line: DesignationLine) => void
}

export function AddDesignationModal({
  designationOptions,
  initialValue,
  onCancel,
  onSave,
}: AddDesignationModalProps) {
  const [designationId, setDesignationId] = useState(initialValue?.designationId ?? '')
  const [staffingRatio, setStaffingRatio] = useState(initialValue?.staffingRatio ?? 1)
  const [monthlySalary, setMonthlySalary] = useState(initialValue?.monthlySalary ?? 0)
  const [leaveBufferPct, setLeaveBufferPct] = useState(initialValue?.leaveBufferPct ?? 0)
  const [currentStaff, setCurrentStaff] = useState(initialValue?.currentStaff ?? 0)

  const selectedDesignation = designationOptions.find((option) => option.id === designationId)
  const isValid = designationId !== '' && staffingRatio > 0 && monthlySalary >= 0

  function handleSubmit() {
    if (!isValid) return
    onSave({
      id: initialValue?.id,
      designationId,
      designationName: selectedDesignation?.name ?? initialValue?.designationName,
      staffingRatio,
      monthlySalary,
      leaveBufferPct,
      currentStaff,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">
          {initialValue ? 'Edit Designation' : 'Add Designation'}
        </h3>

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
            <span className="font-medium text-slate-600">Staffing Ratio (beds per staff)</span>
            <input
              type="number"
              min={0.01}
              step={0.5}
              className="rounded-md border border-slate-300 px-3 py-2"
              value={staffingRatio}
              onChange={(event) => setStaffingRatio(Number(event.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Monthly Salary (₹)</span>
            <input
              type="number"
              min={0}
              className="rounded-md border border-slate-300 px-3 py-2"
              value={monthlySalary}
              onChange={(event) => setMonthlySalary(Number(event.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Leave Buffer (%)</span>
            <input
              type="number"
              min={0}
              className="rounded-md border border-slate-300 px-3 py-2"
              value={leaveBufferPct}
              onChange={(event) => setLeaveBufferPct(Number(event.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Current Staff</span>
            <input
              type="number"
              min={0}
              className="rounded-md border border-slate-300 px-3 py-2"
              value={currentStaff}
              onChange={(event) => setCurrentStaff(Number(event.target.value))}
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
            onClick={handleSubmit}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
