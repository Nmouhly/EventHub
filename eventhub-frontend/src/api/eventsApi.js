import { request, getCollection } from './axios';
export const getEvents = (params) => getCollection('/events', params);
export const getEventById = (id) => request('get', `/events/${id}`);
export const createEvent = (data) => request('post', '/events', data);
export const updateEvent = (id, data) => request('put', `/events/${id}`, data);
export const updateEventStatus = (id, status) =>
  request('patch', `/events/${id}/status`, { status });
