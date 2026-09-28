import { request } from './axios';
export const getDashboard = () => request('get', '/dashboard');
