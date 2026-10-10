import { useState } from 'react'
import { referenceDataApi } from '../../../api/manpowerPlanningApi'
import { downloadBlob } from '../../../utils/download'
import type { PlanRowValues, PlanUploadResult, UploadedPlanGroup } from '../planUpload'

interface UsePlanExcelOptions {
  buildPrefillRows: () => PlanRowValues[]
  onApply: (group: UploadedPlanGroup) => void
  onError: (message: string) => void
}

/**
 * Download/upload of the "Excel Upload" format for Module 1. exceljs is loaded on
 * demand, and the reference hierarchy is fetched fresh each time so names added via
 * "Add Location/Hospital/Department" are immediately valid in the template and upload.
 */
export function usePlanExcel({ buildPrefillRows, onApply, onError }: UsePlanExcelOptions) {
  const [result, setResult] = useState<PlanUploadResult | null>(null)
  const [appliedKey, setAppliedKey] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  function apply(group: UploadedPlanGroup) {
    onApply(group)
    setAppliedKey(group.key)
  }

  async function downloadFormat() {
    setIsBusy(true)
    try {
      const [hierarchy, { exportPlanTemplate }] = await Promise.all([
        referenceDataApi.getHierarchy(),
        import('../planUploadExcel'),
      ])
      downloadBlob('manpower-plan-upload-format.xlsx', await exportPlanTemplate(hierarchy, buildPrefillRows()))
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not generate the Excel format.')
    } finally {
      setIsBusy(false)
    }
  }

  async function upload(file: File) {
    setIsBusy(true)
    try {
      const [hierarchy, { parsePlanWorkbook }, buffer] = await Promise.all([
        referenceDataApi.getHierarchy(),
        import('../planUploadExcel'),
        file.arrayBuffer(),
      ])
      const parsed = await parsePlanWorkbook(buffer, hierarchy)
      setResult(parsed)
      setAppliedKey(null)
      if (parsed.groups.length > 0) apply(parsed.groups[0])
    } catch (error) {
      setResult(null)
      onError(error instanceof Error ? `Could not read the Excel file: ${error.message}` : 'Could not read the Excel file.')
    } finally {
      setIsBusy(false)
    }
  }

  return {
    result,
    appliedKey,
    isBusy,
    downloadFormat,
    upload,
    apply,
    dismiss: () => {
      setResult(null)
      setAppliedKey(null)
    },
  }
}
