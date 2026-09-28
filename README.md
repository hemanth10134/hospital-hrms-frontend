# Hospital HRMS - Frontend

React + TypeScript (Vite), Tailwind CSS.

## Modules

- `src/features/manpower-planning` — Manpower Planning page: hospital/department
  selection, department parameters, designation-wise staffing table with live
  required-staff/vacancy/budget calculations, additional position requests, and
  department summary.

## Running locally

The Manpower Planning backend (`hospital-hrms-backend/manpower-planning-service`)
must be running on `http://localhost:8081` — see that repo's README.

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`. To point the frontend at a different backend
URL, set `VITE_MANPOWER_PLANNING_API_BASE_URL` in a `.env.local` file.

## Tests

```bash
npm run test
```

## Build

```bash
npm run build
```
