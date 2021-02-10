import { Banner } from "components/Banner";
import { useRedux } from "hooks/useRedux";

export const WarningBanner = () => {
  const { settings } = useRedux("settings");

  if (settings.pubnet) {
    return (
      <Banner>
        WARNING: You’ve connected a real account to this demo. You are not on
        the test server. Any actions you take here will affect actual assets.
      </Banner>
    );
  }

  return null;
};
