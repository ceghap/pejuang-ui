import { useAuthStore } from '../store/authStore';

const BASE_URL = 'http://localhost:5000/api';

/**
 * Custom fetch wrapper that automatically:
 * 1. Injects the Bearer JWT from Zustand into headers
 * 2. Formats JSON
 * 3. Catches the specific 403 "password_reset_required" error from IdentityService
 */
export async function fetchClient(endpoint, options = {}) {
  const { token, forcePasswordChange } = useAuthStore.getState();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If we receive a 403 Forbidden, IdentityService sends a specific reason
  if (response.status === 403) {
    const data = await response.json().catch(() => null);
    if (data?.reason === 'password_reset_required') {
      // Trigger the Zustand store to navigate the app to /change-password
      forcePasswordChange(data.userId);
      throw new Error('PASSWORD_RESET_REQUIRED');
    }
  }

  if (!response.ok) {
    const text = await response.text();
    let errorMsg = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed.error) errorMsg = parsed.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg || `API Error: ${response.status}`);
  }

  return response.json().catch(() => ({}));
}

export async function downloadFile(endpoint, filename) {
  const { token } = useAuthStore.getState();

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`Download Failed: ${response.status}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
