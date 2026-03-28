# Kuber - Gemstone Inventory Management System

A professional gemstone inventory management system for tracking, certifying, and managing precious gemstone collections. Built for gemstone dealers and businesses to streamline their inventory, sales, invoicing, and analytics workflows.

## Features

### Core
- **Inventory Management** — Add, edit, and delete gemstone items with serial numbers, categories, shapes (single or mix), weight, dimensions, certification, location, and images
- **Category & Shape Management** — Organize inventory with custom categories and gemstone shapes
- **Sales & Partial Selling** — Sell full or partial inventory by shape, with per-carat pricing and automatic stock adjustments
- **Invoice Generation** — Create, preview, and download PDF invoices; bulk invoice support
- **Dashboard** — Real-time stats (total inventory, in-stock value, sold items, pending) with auto-refresh

### Business Intelligence
- **Analytics** — Revenue trends, monthly breakdowns, category-wise analysis, and customer insights via interactive charts
- **Audit Logs** — Complete activity trail for all system actions
- **Profit Reports** — Track revenue, cost, and profit with exportable reports

### Administration
- **User Management** — Admin and staff roles with role-based access control
- **Company Settings** — Configure company name, logo, and signature for invoices
- **Recycle Bin** — Soft-delete with restore capability for inventory and categories
- **Undo Sales** — Reverse completed sales to restore inventory

### Data Portability
- **Excel Export** — Export inventory, sales, users, audit logs, categories, and profit reports to `.xlsx`
- **CSV Import** — Bulk import inventory from CSV files
- **Multi-Currency** — Supports INR, USD, EUR, and GBP

### UX
- **Responsive Design** — Mobile-friendly with collapsible sidebar navigation
- **Global Search** — Search across inventory
- **Customizable Pagination** — 10, 25, 50, or 100 items per page
- **Image Uploads** — Attach gemstone images to inventory items

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (Radix UI primitives) |
| Routing | React Router v6 |
| Data Fetching | TanStack React Query + Axios |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| PDF Generation | jsPDF |
| Excel/CSV | xlsx |
| Deployment | Vercel |

## Prerequisites

- Node.js 18+
- npm or bun
- Kuber backend API running (default: `http://localhost:5001`)

## Getting Started

```bash
# Clone the repository
git clone <https://github.com/lashkaryadi/kuber.git>
cd fc

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local and set VITE_API_URL to your backend URL

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5001` |
| `VITE_APP_NAME` | Application display name | `Kuber` |
| `VITE_APP_ENV` | Environment (local/production) | `local` |
| `VITE_TOKEN_KEY` | LocalStorage key for auth token | `accessToken` |
| `VITE_ENABLE_EXPORT` | Enable Excel export features | `true` |
| `VITE_ENABLE_IMAGES` | Enable image upload features | `true` |

## Scripts

```bash
npm run dev        # Start dev server with hot reload
npm run build      # Production build
npm run build:dev  # Development build
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## Project Structure

```
src/
├── components/
│   ├── auth/           # ProtectedRoute, Signup
│   ├── common/         # DataTable, Pagination, Modal, StatCard, StatusBadge
│   ├── inventory/      # AddInventoryDialog, SellInventoryDialog, InventoryTable, CategorySelector, ShapeSelector
│   ├── layout/         # MainLayout, Header, Sidebar
│   └── ui/             # shadcn/ui components
├── contexts/           # AuthContext, SearchContext
├── hooks/              # useInventory, useMobile, useToast
├── pages/              # Dashboard, Inventory, Categories, SoldItems, Analytics, AuditLogs, Users, RecycleBin, Settings, Packaging, InvoicePreview, Login, Signup
├── services/           # API client (api.ts), PDF generation (pdfService.ts)
├── types/              # TypeScript interfaces (inventory, api)
└── utils/              # Currency formatting, API helpers
```

## API Integration

This is the frontend client for the Kuber backend. The API provides endpoints for:

- `/api/auth/*` — Authentication (login, register, verify email, refresh token)
- `/api/inventory/*` — Inventory CRUD, export, import
- `/api/categories/*` — Category management
- `/api/shapes/*` — Shape management
- `/api/sales/*` — Sales and sold items
- `/api/invoices/*` — Invoice generation and PDF download
- `/api/dashboard` — Dashboard statistics
- `/api/analytics` — Sales analytics and profit reports
- `/api/audit-logs` — Activity audit trail
- `/api/users/*` — User management
- `/api/recycle-bin/*` — Soft-deleted item recovery
- `/api/company` — Company settings
- `/api/packaging/*` — Packaging management
- `/api/upload` — Image uploads

## Deployment

The project is configured for Vercel deployment with SPA routing (`vercel.json`). To deploy:

```bash
npm run build
# Deploy the dist/ directory to Vercel
```

Or connect the repository to Vercel for automatic deployments.
