import { useEffect, useState } from 'react'
import type { Lookup, PlanningPeriod } from '../../../types/manpowerPlanning'
import { referenceDataApi } from '../../../api/manpowerPlanningApi'
import type { HospitalPlanningSelection } from '../components/HospitalPlanningDetails'

export function useReferenceData(selection: HospitalPlanningSelection) {
  const [organizations, setOrganizations] = useState<Lookup[]>([])
  const [locations, setLocations] = useState<Lookup[]>([])
  const [hospitals, setHospitals] = useState<Lookup[]>([])
  const [departments, setDepartments] = useState<Lookup[]>([])
  const [designations, setDesignations] = useState<Lookup[]>([])
  const [planningPeriods, setPlanningPeriods] = useState<PlanningPeriod[]>([])

  useEffect(() => {
    referenceDataApi.getOrganizations().then(setOrganizations)
    referenceDataApi.getPlanningPeriods().then(setPlanningPeriods)
  }, [])

  useEffect(() => {
    if (!selection.organizationId) {
      setLocations([])
      setDesignations([])
      return
    }
    referenceDataApi.getLocations(selection.organizationId).then(setLocations)
    referenceDataApi.getDesignations(selection.organizationId).then(setDesignations)
  }, [selection.organizationId])

  useEffect(() => {
    if (!selection.locationId) {
      setHospitals([])
      return
    }
    referenceDataApi.getHospitals(selection.locationId).then(setHospitals)
  }, [selection.locationId])

  useEffect(() => {
    if (!selection.hospitalId) {
      setDepartments([])
      return
    }
    referenceDataApi.getDepartments(selection.hospitalId).then(setDepartments)
  }, [selection.hospitalId])

  return { organizations, locations, hospitals, departments, designations, planningPeriods }
}
