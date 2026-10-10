import type { Lookup, PlanningPeriod } from '../../../types/manpowerPlanning'
import { SectionCard } from '../../../components/SectionCard'
import { SelectField } from '../../../components/SelectField'
import { SearchableSelect } from '../../../components/SearchableSelect'
import { STEP_THEMES } from '../stepTheme'

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
      stepNumber={STEP_THEMES.basicDetails.stepNumber}
      color={STEP_THEMES.basicDetails.color}
      tintColor={STEP_THEMES.basicDetails.tintColor}
      title="Hospital &amp; Planning Details"
      infoBullets={STEP_THEMES.basicDetails.bullets}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
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
        <SearchableSelect
          label="Planning Period"
          value={selection.planningPeriodId}
          options={planningPeriods.map((period) => ({ id: period.id, code: period.code, name: period.label }))}
          disabled={disabled}
          onChange={(planningPeriodId) => onChange({ ...selection, planningPeriodId })}
        />
      </div>
    </SectionCard>
  )
}
