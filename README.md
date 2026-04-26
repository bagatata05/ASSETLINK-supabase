# AssetLink — Smart School Maintenance

AssetLink is a three-tier, QR-enabled asset management and repair tracking system designed for Philippine public schools. It replaces manual paper logbooks with a transparent, digital workflow that connects teachers, principals, and maintenance staff.

---

## 🏗️ Architecture

The project is structured as a **monorepo** with three distinct services working together:

### 1. `landing/` — The Public Face
- **Tech**: Next.js (App Router), Framer Motion, Lenis (Smooth Scroll), Tailwind CSS.
- **Purpose**: Explains the system's impact and redirects users to the functional dashboard.

### 2. `dashboard/` — The Internal Engine
- **Tech**: Vite, React, Radix UI, Supabase SDK, Recharts.
- **Purpose**: Role-based portal for scanning QR codes, reporting damage, and managing repair workflows.
- **Database**: Supabase (Postgres + Real-time) serves as the unified source of truth.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **pnpm** (Recommended package manager)
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/bagatata05/ASSETLINK-WITH-QR-CODE.git
   cd ASSETLINK-WITH-QR-CODE
   ```

2. **Install all dependencies**
   Run this from the root directory to install dependencies for all three tiers:
   ```bash
   pnpm install
   ```

To start the system (Landing and Dashboard) simultaneously, run:

```bash
pnpm dev
```

- **Landing Page**: Open `http://localhost:3000`
- **Dashboard**: Open `http://localhost:5173`
- **Data Source**: Managed via Supabase Cloud

---

| Tier          | Primary Packages                                                          |
| ------------- | ------------------------------------------------------------------------- |
| **Landing**   | `next`, `framer-motion`, `lenis`, `lucide-react`, `tailwindcss`           |
| **Dashboard** | `react`, `vite`, `@supabase/supabase-js`, `@radix-ui/react-*`, `recharts` |

---

## 🔐 Role-Based Access

The system is optimized for three primary school roles:

1.  **Teacher**: Reports damage via QR scan and verifies completed repairs.
2.  **Principal**: Reviews reports, prioritizes tasks, and assigns work orders.
3.  **Maintenance**: Manages a personal task list and updates repair status.

---

## 🤝 Workflow

1.  **Scan**: User arrives at the **Landing** page, clicks "Sign In".
2.  **Report**: Teacher scans an asset QR code in the **Dashboard** to report damage.
3.  **Triage**: Principal reviews the request (synced via **Supabase**) and assigns it.
4.  **Repair**: Maintenance staff receives a work order and updates the status.
5.  **Verify**: Teacher signs off on the fix, ensuring accountability.

---

## ⚖️ License

Educational Use Only — ITPE 104 / SDG 4
