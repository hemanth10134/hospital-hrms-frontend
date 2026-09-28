import { SectionCard } from '../../../components/SectionCard'

export interface DepartmentParameters {
  numberOfBeds: number
  departmentOperatingHours: number
  employeeWorkingHours: number
}

interface DepartmentDetailsProps {
  parameters: DepartmentParameters
  onChange: (parameters: DepartmentParameters) => void
  disabled?: boolean
}

export function DepartmentDetails({ parameters, onChange, disabled }: DepartmentDetailsProps) {
  return (
    <SectionCard stepNumber={2} color="#059669" title="Department Details">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Number of Beds</span>
          <input
            type="number"
            min={0}
            className="rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
            value={parameters.numberOfBeds}
            disabled={disabled}
            onChange={(event) => onChange({ ...parameters, numberOfBeds: Number(event.target.value) })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Department Operating Hours (per day)</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0.1}
              step={0.5}
              className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              value={parameters.departmentOperatingHours}
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...parameters, departmentOperatingHours: Number(event.target.value) })
              }
            />
            <span className="text-sm text-slate-500">hours</span>
          </div>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Employee Working Hours (per day)</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0.1}
              step={0.5}
              className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              value={parameters.employeeWorkingHours}
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...parameters, employeeWorkingHours: Number(event.target.value) })
              }
            />
            <span className="text-sm text-slate-500">hours</span>
          </div>
        </label>
      </div>
    </SectionCard>
  )
}
