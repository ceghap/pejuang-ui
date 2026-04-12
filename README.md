# Pejuang UI (Modular Monolith Frontend)

The official frontend for the `pejuang-mono` project. This application provides a modern, interactive interface for managing users, hierarchy, products, and financial installments within the Pejuang ecosystem.

## 🚀 Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) + [Lucide Icons](https://lucide.dev/)
- **Forms**: [TanStack Form](https://tanstack.com/form)

## 🏗 Project Status: Phase 3 (Product & Finance Engine)

We have successfully completed **Phase 3**. The UI now supports:

- **Identity & Access**: Dual-login (IC/Phone), role-based access control, and mandatory password reset flows.
- **Hierarchy Management**: Visual tree representation of introducers and downlines.
- **Product Catalog**: Dynamic management of categories and products (including historical seed data like Gerak, Susuk, and Selendang).
- **Finance Engine**: 
  - Automated installment tiering (Silver, Gold, Platinum).
  - Commission distribution visualization.
  - Order creation with mandatory 10% deposit.

## 🛠 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository (if not already part of the workspace).
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:5173` (by default).

### Environment Configuration

Ensure your `.env` or configuration points to the `pejuang-mono` backend (typically `http://localhost:5000/api`).

## 📁 Project Structure

- `src/api/`: Fetching logic and API client configuration.
- `src/components/`: Reusable UI components (Shadcn + custom).
- `src/pages/`: Main application views (Login, Profile, Admin, Shop, etc.).
- `src/store/`: Zustand stores for authentication and global state.
- `src/lib/`: Utility functions and configuration.

## 🛣 Next Steps (Phase 4: Billing & Notifications)

Future development will focus on:
- **My Bills**: Monthly installment schedules and payment history.
- **Upline Portal**: Real-time commission forecasts and realized gain tracking.
- **Bulk Payments**: Integration with payment gateways for installment settlement.
- **Automated Notifications**: Alerts for overdue payments and commission earnings.
