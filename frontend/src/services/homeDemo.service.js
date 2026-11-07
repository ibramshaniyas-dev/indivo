import api from './api';

const data = (p) => p.then((r) => r.data.data);

// Customer
export const getDemoAvailability = (lat, lng) => data(api.get('/home-demo/availability', { params: { lat, lng } }));
export const bookHomeDemo = async (payload) => (await api.post('/home-demo/bookings', payload)).data;
export const getMyDemoBookings = () => data(api.get('/home-demo/bookings'));
export const cancelMyDemoBooking = async (id, reason) => (await api.post(`/home-demo/bookings/${id}/cancel`, { reason })).data;

// Admin
export const getDemoZones = () => data(api.get('/admin/home-demo/zones'));
export const createDemoZone = async (zone) => (await api.post('/admin/home-demo/zones', zone)).data;
export const updateDemoZone = async (id, zone) => (await api.put(`/admin/home-demo/zones/${id}`, zone)).data;
export const deleteDemoZone = async (id) => (await api.delete(`/admin/home-demo/zones/${id}`)).data;
export const getDemoZoneProducts = (id) => data(api.get(`/admin/home-demo/zones/${id}/products`));
export const setDemoZoneProduct = async (zoneId, productId, pieces) => (await api.put(`/admin/home-demo/zones/${zoneId}/products/${productId}`, { pieces })).data;
export const removeDemoZoneProduct = async (zoneId, productId) => (await api.delete(`/admin/home-demo/zones/${zoneId}/products/${productId}`)).data;
export const getDemoBookings = (params) => data(api.get('/admin/home-demo/bookings', { params }));
export const updateDemoBooking = async (id, action, body = {}) => (await api.post(`/admin/home-demo/bookings/${id}/${action}`, body)).data;
