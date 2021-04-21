export const createPopup = (popupUrl: string) => {
  const url = new URL(popupUrl);
  const popup = open(url.toString(), "popup", "width=500,height=800");

  if (!popup) {
    throw new Error(
      "Popups are blocked. You’ll need to enable popups for this demo to work",
    );
  }

  return popup;
};
