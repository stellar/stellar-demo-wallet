import { StatusBar } from "@stellar/design-system";
import { useRedux } from "hooks/useRedux";

export const WarningBanner = () => {
  const { account, settings } = useRedux("account", "settings");

  // Show the banner only if signed in
  if (settings.pubnet && account.data?.id) {
    return (
      <StatusBar variant={StatusBar.variant.error}>
        WARNING: You’ve connected a real account to this demo. You are not on
        the test server. Any actions you take here will affect actual assets.
      </StatusBar>
    );
  }

  return null;
};
