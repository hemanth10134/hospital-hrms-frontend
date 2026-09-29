import { useCallback, useEffect, useState } from 'react'
import type { Lookup, PlanningPeriod } from '../../../types/manpowerPlanning'
import { referenceDataApi } from '../../../api/manpowerPlanningApi'
import type { HospitalPlanningSelection } from '../components/HospitalPlanningDetails'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

function describeError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'ERR_NETWORK') {
    return 'Could not reach the Manpower Planning backend. Confirm it is running at http://localhost:8081.'
  }
  return error instanceof Error ? error.message : 'Failed to load reference data.'
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withRetry<T>(fn: () => Promise<T>, attempts = MAX_RETRIES): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (attempts <= 1) throw error
    await delay(RETRY_DELAY_MS)
    return withRetry(fn, attempts - 1)
  }
}

export function useReferenceData(selection: HospitalPlanningSelection) {
  const [organizations, setOrganizations] = useState<Lookup[]>([])
  const [locations, setLocations] = useState<Lookup[]>([])
  const [hospitals, setHospitals] = useState<Lookup[]>([])
  const [departments, setDepartments] = useState<Lookup[]>([])
  const [designations, setDesignations] = useState<Lookup[]>([])
  const [planningPeriods, setPlanningPeriods] = useState<PlanningPeriod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)

  const retry = useCallback(() => setRetryToken((token) => token + 1), [])

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      withRetry(() => referenceDataApi.getOrganizations()),
      withRetry(() => referenceDataApi.getPlanningPeriods()),
    ])
      .then(([orgs, periods]) => {
        setOrganizations(orgs)
        setPlanningPeriods(periods)
        setError(null)
      })
      .catch((err) => setError(describeError(err)))
      .finally(() => setIsLoading(false))
  }, [retryToken])

  useEffect(() => {
    if (!selection.organizationId) {
      setLocations([])
      setDesignations([])
      return
    }
    referenceDataApi.getLocations(selection.organizationId).then(setLocations).catch((err) => setError(describeError(err)))
    referenceDataApi
      .getDesignations(selection.organizationId)
      .then(setDesignations)
      .catch((err) => setError(describeError(err)))
  }, [selection.organizationId])

  useEffect(() => {
    if (!selection.locationId) {
      setHospitals([])
      return
    }
    referenceDataApi.getHospitals(selection.locationId).then(setHospitals).catch((err) => setError(describeError(err)))
  }, [selection.locationId])

  useEffect(() => {
    if (!selection.hospitalId) {
      setDepartments([])
      return
    }
    referenceDataApi
      .getDepartments(selection.hospitalId)
      .then(setDepartments)
      .catch((err) => setError(describeError(err)))
  }, [selection.hospitalId])

  return { organizations, locations, hospitals, departments, designations, planningPeriods, isLoading, error, retry }
}
