import { request } from './axios';
export const signIn = (credentials) => request('post', '/auth/login', credentials);
export const getMe = () => request('get', '/auth/me');
