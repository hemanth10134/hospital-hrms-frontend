export interface StepTheme {
  stepNumber: number
  color: string
  tintColor: string
  title: string
  bullets: string[]
}

export const STEP_THEMES: Record<'basicDetails' | 'departmentParameters' | 'designationPlanning' | 'positionRequests' | 'summary', StepTheme> = {
  basicDetails: {
    stepNumber: 1,
    color: '#2563eb',
    tintColor: '#eff6ff',
    title: 'Select Basic Details',
    bullets: ['Choose organization, location, hospital, department and planning period.'],
  },
  departmentParameters: {
    stepNumber: 2,
    color: '#059669',
    tintColor: '#ecfdf5',
    title: 'Department Parameters',
    bullets: ['Enter number of beds and working hours. These will be used for automatic calculations.'],
  },
  designationPlanning: {
    stepNumber: 3,
    color: '#ea580c',
    tintColor: '#fff7ed',
    title: 'Designation-wise Planning',
    bullets: [
      'Staffing ratio',
      'Monthly salary',
      'Leave buffer %',
      'Required staff (auto)',
      'Current staff',
      'Vacancies / excess',
      'Monthly budget',
      'Add, edit or delete designations',
      'Filter and search',
      'Excel upload and download',
    ],
  },
  positionRequests: {
    stepNumber: 4,
    color: '#db2777',
    tintColor: '#fdf2f8',
    title: 'Additional Position Requests',
    bullets: [
      'Create new positions beyond the plan',
      'Add reason and budget details',
      'Track approval status',
      'View request history',
    ],
  },
  summary: {
    stepNumber: 5,
    color: '#2563eb',
    tintColor: '#ffffff',
    title: 'Summary',
    bullets: ['Total required staff', 'Current staff', 'Open positions', 'Estimated monthly budget'],
  },
}
