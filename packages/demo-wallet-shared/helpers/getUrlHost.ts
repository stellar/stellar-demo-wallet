export const getUrlHost = (url: string) => {
  try {
    return new URL(url).host || url;
  } catch (e) {
    return url;
  }
};
