import { transaction } from "../config/database.js";
import { dayBounds } from "../utils/date.js";
import * as dashboard from "../repositories/dashboardRepository.js";
export const getDashboard = () =>
  transaction(
    async (db) => {
      const { start, end } = dayBounds();
      const stats = await dashboard.stats(db, start, end);
      return {
        ...stats,
        topEvents: await dashboard.topEvents(db),
        upcomingEvents: await dashboard.upcomingEvents(db),
      };
    },
    { readOnly: true },
  );
