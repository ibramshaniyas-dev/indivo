import api from './api';

export async function registerSeller(payload) {
  const { data } = await api.post('/sellers/register', payload);
  localStorage.setItem('accessToken', data.data.accessToken);
  localStorage.setItem('refreshToken', data.data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.data.user));
  return data.data.user;
}

export async function getMySeller() {
  const { data } = await api.get('/sellers/me');
  return data.data;
}

export async function updateBusiness(payload) {
  const { data } = await api.put('/sellers/business', payload);
  return data;
}

export async function updateBank(payload) {
  const { data } = await api.put('/sellers/bank', payload);
  return data;
}

export async function uploadDocument(docType, file) {
  const formData = new FormData();
  formData.append('docType', docType);
  formData.append('document', file);
  const { data } = await api.post('/sellers/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function removeDocument(docId) {
  await api.delete(`/sellers/documents/${docId}`);
}

export async function acceptAgreement() {
  const { data } = await api.post('/sellers/agreement');
  return data;
}

export async function submitApplication() {
  const { data } = await api.post('/sellers/submit');
  return data;
}
