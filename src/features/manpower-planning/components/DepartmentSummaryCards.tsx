import { SectionCard } from '../../../components/SectionCard'
import { formatCurrency } from '../../../utils/formatters'
import type { DepartmentSummary } from '../../../types/manpowerPlanning'
import { STEP_THEMES } from '../stepTheme'

interface DepartmentSummaryCardsProps {
  summary: DepartmentSummary
}

export function DepartmentSummaryCards({ summary }: DepartmentSummaryCardsProps) {
  const cards = [
    {
      label: 'Total Required Staff',
      value: summary.totalRequiredStaff,
      icon: '👥',
      className: 'bg-blue-50 text-blue-700',
    },
    { label: 'Current Staff', value: summary.currentStaff, icon: '👥', className: 'bg-slate-100 text-slate-700' },
    { label: 'Open Positions', value: summary.openPositions, icon: '➕', className: 'bg-red-50 text-red-600' },
    {
      label: 'Estimated Monthly Budget',
      value: formatCurrency(summary.estimatedMonthlyBudget),
      icon: '₹',
      className: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Additional Positions',
      value: summary.additionalPositions ?? 0,
      icon: '➕',
      className: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Additional Monthly Budget',
      value: formatCurrency(summary.additionalMonthlyBudgetRequested ?? 0),
      icon: '₹',
      className: 'bg-pink-50 text-pink-700',
    },
  ]

  return (
    <SectionCard
      stepNumber={STEP_THEMES.summary.stepNumber}
      color={STEP_THEMES.summary.color}
      tintColor={STEP_THEMES.summary.tintColor}
      title="Department Summary"
      infoBullets={STEP_THEMES.summary.bullets}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`app-card flex items-center gap-3 rounded-lg p-4 transition-transform hover:-translate-y-0.5 ${card.className}`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-lg">
              {card.icon}
            </span>
            <div>
              <p className="text-sm font-medium">{card.label}</p>
              <p className="mt-0.5 text-2xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
