import api from './api';

export async function getAdminSettings() {
  const { data } = await api.get('/admin/settings');
  return data.data;
}

/** updates: [{ group, key, value }] — blank secret values are ignored server-side (kept as-is). */
export async function saveSettings(updates) {
  const { data } = await api.put('/admin/settings', { updates });
  return data;
}

export async function testIntegration(integration) {
  const { data } = await api.post(`/admin/settings/test/${integration}`);
  return data;
}

export async function getPublicSettings() {
  const { data } = await api.get('/settings/public');
  return data.data;
}

export async function updateMyProfile(payload) {
  const { data } = await api.put('/auth/me', payload);
  return data.data;
}

export async function changeMyPassword(payload) {
  const { data } = await api.post('/auth/change-password', payload);
  return data;
}
