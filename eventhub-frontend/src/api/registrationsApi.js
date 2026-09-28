import { request, getCollection } from './axios';
export const getRegistrations = (params) => getCollection('/registrations', params);
export const createRegistration = (data) => request('post', '/registrations', data);
export const updateRegistrationStatus = (id, status) =>
  request('patch', `/registrations/${id}/status`, { status });
