import type { PositionRequest } from '../../../types/manpowerPlanning'
import { ModalShell } from '../../../components/ModalShell'
import { formatCurrency } from '../../../utils/formatters'

interface PositionRequestDetailModalProps {
  request: PositionRequest
  onClose: () => void
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  )
}

export function PositionRequestDetailModal({ request, onClose }: PositionRequestDetailModalProps) {
  return (
    <ModalShell>
      <h3 className="mb-4 text-lg font-semibold text-slate-800">Position Request Details</h3>
      <div className="flex flex-col">
        <Row label="Department" value={request.department.name} />
        <Row label="Designation" value={request.designation.name} />
        <Row label="Requested Positions" value={String(request.requestedPositions)} />
        <Row label="Reason" value={request.reason} />
        <Row label="Additional Monthly Budget" value={formatCurrency(request.additionalMonthlyBudget)} />
        <Row label="Status" value={request.status.replace('_', ' ')} />
        <Row label="Requested By" value={request.requestedBy} />
        <Row label="Requested At" value={new Date(request.createdAt).toLocaleString()} />
        {request.reviewedBy && <Row label="Reviewed By" value={request.reviewedBy} />}
        {request.reviewedAt && <Row label="Reviewed At" value={new Date(request.reviewedAt).toLocaleString()} />}
      </div>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          className="app-button rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </ModalShell>
  )
}
