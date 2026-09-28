import { request, getCollection } from './axios';
export const getParticipants = (params) => getCollection('/participants', params);
export const createParticipant = (data) => request('post', '/participants', data);
export const updateParticipant = (id, data) => request('put', `/participants/${id}`, data);
export const deleteParticipant = (id) => request('delete', `/participants/${id}`);
