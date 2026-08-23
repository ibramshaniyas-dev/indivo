import api from './api';

export async function getShipment(sellerOrderId) {
  const { data } = await api.get(`/admin/shipments/${sellerOrderId}`);
  return data.data;
}

export async function createShipment(sellerOrderId) {
  const { data } = await api.post(`/admin/shipments/${sellerOrderId}/create`);
  return data.data;
}

export async function getCouriers(sellerOrderId) {
  const { data } = await api.get(`/admin/shipments/${sellerOrderId}/couriers`);
  return data.data;
}

export async function generateAWB(sellerOrderId, courierId) {
  const { data } = await api.post(`/admin/shipments/${sellerOrderId}/awb`, { courierId });
  return data.data;
}

export async function requestPickup(sellerOrderId) {
  const { data } = await api.post(`/admin/shipments/${sellerOrderId}/pickup`);
  return data.data;
}

export async function generateLabel(sellerOrderId) {
  const { data } = await api.get(`/admin/shipments/${sellerOrderId}/label`);
  return data.data;
}

export async function trackShipment(sellerOrderId) {
  const { data } = await api.get(`/admin/shipments/${sellerOrderId}/track`);
  return data.data;
}

export async function cancelShipment(sellerOrderId) {
  const { data } = await api.post(`/admin/shipments/${sellerOrderId}/cancel`);
  return data.data;
}
