# Pejuang UI Project Context & AI Instructions

This file provides persistent context and mandates for the Gemini CLI agent and AI helpers working on the `pejuang-ui` project.

## Core Project Overview
- **Type**: React 19 Single Page Application (SPA)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Shadcn UI
- **Routing**: React Router 7
- **State Management**: Zustand (for Global Auth) + TanStack Query (for Data Fetching)
- **Forms**: TanStack Form

## Core Mandates

### Frontend Development
- **React 19 Hooks**: Use modern React 19 patterns.
- **Component Design**: 
  - Prefer Functional Components with hooks.
  - Use Shadcn UI for low-level components (`components/ui/`).
  - Keep page logic inside `src/pages/` and reusable business components in `src/components/`.
- **API Communication**:
  - Always use the `fetchClient` from `src/api/fetchClient.js`.
  - It handles JWT injection and the mandatory `password_reset_required` (403) interceptor automatically.
- **Form Handling**:
  - Use `<form.Field name="...">{(field) => ...}</form.Field>` syntax for TanStack Form.
  - Always include validation feedback and loading states (e.g., `<Loader2 className="animate-spin" />`).
- **Data Fetching**:
  - Use `useQuery` for GET requests and `useMutation` for POST/PUT/DELETE.
  - Always invalidate the relevant query keys on successful mutations to ensure the UI is in sync.
- **Icons**: Use `lucide-react` for all icons. Ensure icons are imported correctly to avoid runtime errors.

### User Experience & Flows
- **Authentication**: Redirect to `/login` if unauthenticated.
- **Mandatory Password Reset**: If a user is flagged with `MustChangePassword`, the `fetchClient` will trigger a redirect to `/change-password`. Do not bypass this flow.
- **Toasts**: Use `sonner` for all success/error notifications.
- **Naming Conventions**: 
  - Use "Product Categories" instead of "Categories" to distinguish from other potential category types.
  - Use "Order Tiers" for installment pricing logic.

## Development Workflow
1. **API Synchronization**: Ensure frontend changes align with the `pejuang-mono` backend endpoints.
2. **Environment**: Base API URL defaults to `http://localhost:5000/api` unless overridden by `VITE_API_BASE_URL`.
3. **Consistency**: Follow existing patterns in pages like `Products.jsx` and `TierConfigs.jsx` for management interfaces.

## Testing & Validation
- **Visual Check**: Ensure layouts are responsive using Tailwind's `md:` and `lg:` prefixes.
- **Form Validation**: Test both success and error paths (e.g., API failure messages from the backend).
