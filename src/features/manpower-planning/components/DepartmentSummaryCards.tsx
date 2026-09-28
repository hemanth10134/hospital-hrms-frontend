import { SectionCard } from '../../../components/SectionCard'
import { formatCurrency } from '../../../utils/formatters'
import type { DepartmentSummary } from '../../../types/manpowerPlanning'

interface DepartmentSummaryCardsProps {
  summary: DepartmentSummary
}

export function DepartmentSummaryCards({ summary }: DepartmentSummaryCardsProps) {
  const cards = [
    { label: 'Total Required Staff', value: summary.totalRequiredStaff, className: 'bg-blue-50 text-blue-700' },
    { label: 'Current Staff', value: summary.currentStaff, className: 'bg-slate-100 text-slate-700' },
    { label: 'Open Positions', value: summary.openPositions, className: 'bg-red-50 text-red-600' },
    {
      label: 'Estimated Monthly Budget',
      value: formatCurrency(summary.estimatedMonthlyBudget),
      className: 'bg-emerald-50 text-emerald-700',
    },
  ]

  return (
    <SectionCard stepNumber={5} color="#2563eb" title="Department Summary">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-lg p-4 ${card.className}`}>
            <p className="text-sm font-medium">{card.label}</p>
            <p className="mt-1 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
