import type { Lookup, PlanningPeriod } from '../../../types/manpowerPlanning'
import { SectionCard } from '../../../components/SectionCard'
import { SelectField } from '../../../components/SelectField'

export interface HospitalPlanningSelection {
  organizationId: string
  locationId: string
  hospitalId: string
  departmentId: string
  planningPeriodId: string
}

interface HospitalPlanningDetailsProps {
  selection: HospitalPlanningSelection
  organizations: Lookup[]
  locations: Lookup[]
  hospitals: Lookup[]
  departments: Lookup[]
  planningPeriods: PlanningPeriod[]
  onChange: (selection: HospitalPlanningSelection) => void
  disabled?: boolean
}

export function HospitalPlanningDetails({
  selection,
  organizations,
  locations,
  hospitals,
  departments,
  planningPeriods,
  onChange,
  disabled,
}: HospitalPlanningDetailsProps) {
  return (
    <SectionCard
      stepNumber={1}
      color="#2563eb"
      title="Hospital &amp; Planning Details"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SelectField
          label="Organization"
          value={selection.organizationId}
          options={organizations}
          disabled={disabled}
          onChange={(organizationId) =>
            onChange({ organizationId, locationId: '', hospitalId: '', departmentId: '', planningPeriodId: selection.planningPeriodId })
          }
        />
        <SelectField
          label="Location"
          value={selection.locationId}
          options={locations}
          disabled={disabled || !selection.organizationId}
          onChange={(locationId) =>
            onChange({ ...selection, locationId, hospitalId: '', departmentId: '' })
          }
        />
        <SelectField
          label="Hospital"
          value={selection.hospitalId}
          options={hospitals}
          disabled={disabled || !selection.locationId}
          onChange={(hospitalId) => onChange({ ...selection, hospitalId, departmentId: '' })}
        />
        <SelectField
          label="Department"
          value={selection.departmentId}
          options={departments}
          disabled={disabled || !selection.hospitalId}
          onChange={(departmentId) => onChange({ ...selection, departmentId })}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Planning Period</span>
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800 disabled:bg-slate-100"
            value={selection.planningPeriodId}
            disabled={disabled}
            onChange={(event) => onChange({ ...selection, planningPeriodId: event.target.value })}
          >
            <option value="" disabled>
              Select planning period
            </option>
            {planningPeriods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </SectionCard>
  )
}
