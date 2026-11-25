const API_BASE = import.meta.env.VITE_API_URL || '';

// Try refreshing the access token once using the stored refresh token
export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!refreshRes.ok) {
    return null;
  }

  const refreshData = await refreshRes.json();
  localStorage.setItem('accessToken', refreshData.accessToken);
  return refreshData.accessToken;
}

// Central Fetch wrapper that attaches the JWT access token and refreshes once on 401
async function apiFetch(url, options = {}, hasRetried = false) {
  const accessToken = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  // If access token expired, try refreshing it once (never loop infinitely)
  if (response.status === 401 && !hasRetried && !url.includes('/api/auth/refresh')) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch(url, options, true);
    }

    // Refresh failed or missing: clear stored session and notify AuthContext
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-logout'));
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export default apiFetch;
