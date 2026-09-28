import { getDashboard } from "../services/dashboardService.js";
export const get = async (req, res) => res.json(await getDashboard());
