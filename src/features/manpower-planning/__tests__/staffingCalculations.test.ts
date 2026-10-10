import { describe, expect, it } from 'vitest'
import {
  calculateExcess,
  calculateMonthlyBudget,
  calculateRequiredStaff,
  calculateStaffingPercentage,
  calculateVacancies,
  summarize,
  withComputedFields,
} from '../staffingCalculations'

describe('staffingCalculations', () => {
  it('calculates required staff using shifts and leave buffer', () => {
    // 20 beds / ratio 10 = 2 base staff, 24/8 = 3 shifts, +10% buffer -> ceil(6.6) = 7
    expect(calculateRequiredStaff(20, 10, 24, 8, 10)).toBe(7)
  })

  it('rounds up partial staff requirements', () => {
    expect(calculateRequiredStaff(20, 8, 8, 8, 0)).toBe(3)
  })

  it('never returns negative vacancies or excess', () => {
    expect(calculateVacancies(5, 6)).toBe(0)
    expect(calculateVacancies(5, 3)).toBe(2)
    expect(calculateExcess(5, 3)).toBe(0)
    expect(calculateExcess(5, 6)).toBe(1)
  })

  it('computes monthly budget as requiredStaff * salary', () => {
    expect(calculateMonthlyBudget(3, 150000)).toBe(450000)
  })

  it('summarizes computed lines into department totals', () => {
    const lines = [
      withComputedFields(
        { designationId: 'a', staffingRatio: 10, monthlySalary: 150000, leaveBufferPct: 10, currentStaff: 2 },
        20,
        24,
        8,
      ),
      withComputedFields(
        { designationId: 'b', staffingRatio: 5, monthlySalary: 80000, leaveBufferPct: 15, currentStaff: 6 },
        20,
        24,
        8,
      ),
    ]

    const summary = summarize(lines)

    expect(summary.totalRequiredStaff).toBe(lines[0].requiredStaff + lines[1].requiredStaff)
    expect(summary.currentStaff).toBe(8)
    expect(summary.openPositions).toBe(summary.totalRequiredStaff - summary.currentStaff)
  })

  it('sums additional positions and budget from non-rejected position requests', () => {
    const lines = [
      withComputedFields(
        { designationId: 'a', staffingRatio: 10, monthlySalary: 150000, leaveBufferPct: 10, currentStaff: 2 },
        20,
        24,
        8,
      ),
    ]
    const positionRequests = [
      { requestedPositions: 2, additionalMonthlyBudget: 50000, status: 'PENDING_APPROVAL' },
      { requestedPositions: 3, additionalMonthlyBudget: 90000, status: 'REJECTED' },
    ]

    const summary = summarize(lines, positionRequests)

    expect(summary.additionalPositions).toBe(2)
    expect(summary.additionalMonthlyBudgetRequested).toBe(50000)
  })

  it('computes staffing percentage as current/required staff', () => {
    expect(calculateStaffingPercentage(7, 2)).toBeCloseTo(28.57, 2)
    expect(calculateStaffingPercentage(0, 0)).toBe(0)
  })
})
