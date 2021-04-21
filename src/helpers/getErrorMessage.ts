export const getErrorMessage = (error: Error) =>
  error.message || error.toString();
