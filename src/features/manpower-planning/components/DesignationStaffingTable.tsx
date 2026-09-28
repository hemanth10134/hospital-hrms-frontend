import { useState } from 'react'
import type { DesignationLine, Lookup } from '../../../types/manpowerPlanning'
import { SectionCard } from '../../../components/SectionCard'
import { formatCurrency } from '../../../utils/formatters'
import { withComputedFields } from '../staffingCalculations'
import { AddDesignationModal } from './AddDesignationModal'

interface DesignationStaffingTableProps {
  lines: DesignationLine[]
  designationOptions: Lookup[]
  numberOfBeds: number
  departmentOperatingHours: number
  employeeWorkingHours: number
  onChange: (lines: DesignationLine[]) => void
  disabled?: boolean
}

export function DesignationStaffingTable({
  lines,
  designationOptions,
  numberOfBeds,
  departmentOperatingHours,
  employeeWorkingHours,
  onChange,
  disabled,
}: DesignationStaffingTableProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const computedLines = lines.map((line) =>
    withComputedFields(line, numberOfBeds, departmentOperatingHours, employeeWorkingHours),
  )

  function handleSave(line: DesignationLine, index: number | null) {
    if (index === null) {
      onChange([...lines, line])
    } else {
      onChange(lines.map((existing, i) => (i === index ? line : existing)))
    }
    setIsAdding(false)
    setEditingIndex(null)
  }

  function handleDelete(index: number) {
    onChange(lines.filter((_, i) => i !== index))
  }

  return (
    <SectionCard
      stepNumber={3}
      color="#ea580c"
      title="Designation-wise Staffing"
      description="Set staffing ratio, salary and leave buffer for each designation. Required staff, vacancies and budget are calculated automatically."
      actions={
        <button
          type="button"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={disabled}
          onClick={() => setIsAdding(true)}
        >
          + Add Designation
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Designation</th>
              <th className="py-2 pr-3">Staffing Ratio</th>
              <th className="py-2 pr-3">Monthly Salary (₹)</th>
              <th className="py-2 pr-3">Leave Buffer (%)</th>
              <th className="py-2 pr-3">Required Staff</th>
              <th className="py-2 pr-3">Current Staff</th>
              <th className="py-2 pr-3">Vacancies</th>
              <th className="py-2 pr-3">Excess</th>
              <th className="py-2 pr-3">Monthly Budget (₹)</th>
              <th className="py-2 pr-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {computedLines.map((line, index) => (
              <tr key={line.id ?? line.designationId} className="border-b border-slate-100">
                <td className="py-2 pr-3 text-slate-500">{index + 1}</td>
                <td className="py-2 pr-3 font-medium text-slate-800">{line.designationName}</td>
                <td className="py-2 pr-3">{line.staffingRatio}</td>
                <td className="py-2 pr-3">{formatCurrency(line.monthlySalary)}</td>
                <td className="py-2 pr-3">{line.leaveBufferPct}%</td>
                <td className="py-2 pr-3 font-semibold">{line.requiredStaff}</td>
                <td className="py-2 pr-3">{line.currentStaff}</td>
                <td className="py-2 pr-3">
                  {line.vacancies > 0 ? (
                    <span className="rounded bg-red-100 px-2 py-0.5 font-semibold text-red-700">
                      {line.vacancies}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-2 pr-3">
                  {line.excess > 0 ? (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                      {line.excess}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-2 pr-3">{formatCurrency(line.monthlyBudget)}</td>
                <td className="py-2 pr-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-blue-600 hover:underline"
                      disabled={disabled}
                      onClick={() => setEditingIndex(index)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      disabled={disabled}
                      onClick={() => handleDelete(index)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {computedLines.length === 0 && (
              <tr>
                <td colSpan={11} className="py-6 text-center text-slate-400">
                  No designations added yet. Click "Add Designation" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(isAdding || editingIndex !== null) && (
        <AddDesignationModal
          designationOptions={designationOptions}
          initialValue={editingIndex !== null ? lines[editingIndex] : undefined}
          onCancel={() => {
            setIsAdding(false)
            setEditingIndex(null)
          }}
          onSave={(line) => handleSave(line, editingIndex)}
        />
      )}
    </SectionCard>
  )
}
