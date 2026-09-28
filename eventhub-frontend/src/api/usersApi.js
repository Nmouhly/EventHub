import { getCollection, request } from './axios';
export const getUsers = (params) => getCollection('/users', params);
export const createUser = (data) => request('post', '/users', data);
export const updateUser = (id, data) => request('put', `/users/${id}`, data);
