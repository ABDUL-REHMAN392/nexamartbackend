export const successResponse = (res, statusCode = 200, message, data = {}) =>
  res.status(statusCode).json({ success: true, message, data });

export const errorResponse = (res, statusCode = 500, message, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};