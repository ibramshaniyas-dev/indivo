import api from './api';

export async function getShipment(sellerOrderId) {
  const { data } = await api.get(`/sellers/orders/${sellerOrderId}/shipment`);
  return data.data;
}

export async function createShipment(sellerOrderId) {
  const { data } = await api.post(`/sellers/orders/${sellerOrderId}/shipment/create`);
  return data.data;
}

export async function getCouriers(sellerOrderId) {
  const { data } = await api.get(`/sellers/orders/${sellerOrderId}/shipment/couriers`);
  return data.data;
}

export async function generateAWB(sellerOrderId, courierId) {
  const { data } = await api.post(`/sellers/orders/${sellerOrderId}/shipment/awb`, { courierId });
  return data.data;
}

export async function requestPickup(sellerOrderId) {
  const { data } = await api.post(`/sellers/orders/${sellerOrderId}/shipment/pickup`);
  return data.data;
}

export async function generateLabel(sellerOrderId) {
  const { data } = await api.get(`/sellers/orders/${sellerOrderId}/shipment/label`);
  return data.data;
}

export async function trackShipment(sellerOrderId) {
  const { data } = await api.get(`/sellers/orders/${sellerOrderId}/shipment/track`);
  return data.data;
}

export async function cancelShipment(sellerOrderId) {
  const { data } = await api.post(`/sellers/orders/${sellerOrderId}/shipment/cancel`);
  return data.data;
}
