export const getNetworkSearchParam = ({
  location,
  pubnet,
}: {
  // TODO: location type
  location: any;
  pubnet?: boolean;
}) => {
  const queryParams = new URLSearchParams(location.search);

  if (pubnet) {
    queryParams.set("pubnet", "true");
  } else {
    queryParams.delete("pubnet");
  }

  return `?${queryParams.toString()}`;
};
