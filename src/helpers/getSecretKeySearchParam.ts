export const getSecretKeySearchParam = ({
  location,
  secretKey,
}: {
  // TODO: location type
  location: any;
  secretKey: string;
}) => {
  const queryParams = new URLSearchParams(location.search);
  queryParams.set("secretKey", secretKey);

  return `?${queryParams.toString()}`;
};
