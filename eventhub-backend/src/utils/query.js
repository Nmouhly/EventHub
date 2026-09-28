export const escapeLike = (value) => `%${value.replace(/[\\%_]/g, "\\$&")}%`;
export const pagination = (data, total, { page, limit }) => ({
  data,
  total,
  pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
});
