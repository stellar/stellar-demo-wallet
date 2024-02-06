import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { Layout, TextLink } from "@stellar/design-system";
import { errorReporting } from "@stellar/frontend-helpers";

import { store } from "config/store";
import { Header } from "components/Header";
import { Footer } from "components/Footer";
import { Logs } from "components/Logs";
import { PrivateRoute } from "components/PrivateRoute";
import { SettingsHandler } from "components/SettingsHandler";
import { WarningBanner } from "components/WarningBanner";

import { Account } from "pages/Account";
import { Landing } from "pages/Landing";
import { NotFound } from "pages/NotFound";
import "./App.scss";

const maskSecretKey = (text: string) =>
  text.replace(/secretKey=S(.*?)([&]|$)/g, "secretKey=S***&");

errorReporting.reportErrors({
  projectName: "demo-wallet",
  tracingOrigins: [/^\/[^/]/],
  extra: {
    beforeBreadcrumb: (breadcrumb: any) => {
      if (breadcrumb.data) {
        breadcrumb.data = {
          ...breadcrumb.data,
          ...(breadcrumb.data.from
            ? { from: maskSecretKey(breadcrumb.data.from) }
            : {}),
          ...(breadcrumb.data.to
            ? { to: maskSecretKey(breadcrumb.data.to) }
            : {}),
        };
      }

      return breadcrumb;
    },
  },
});

export const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <SettingsHandler>
        <WarningBanner />

        <div id="app-wrapper" className="Wrapper">
          <div className="SplitContainer Main">
            <div className="Main__content">
              <Header />

              <Layout.Content>
                <Layout.Inset>
                  <p>
                    This demo wallet lets financial application developers test
                    their integrations and learn how Stellar ecosystem protocols
                    (SEPs) work.
                  </p>

                  <p>
                    <TextLink
                      variant={TextLink.variant.secondary}
                      underline
                      href="https://github.com/stellar/stellar-demo-wallet#stellar-demo-wallet"
                    >
                      How to use this tool
                    </TextLink>
                    <br />
                    <TextLink
                      variant={TextLink.variant.secondary}
                      underline
                      href="https://github.com/stellar/stellar-demo-wallet/issues"
                    >
                      Report issues or request features
                    </TextLink>{" "}
                    on GitHub
                  </p>
                </Layout.Inset>

                <RouterRoutes>
                  <Route path="/" element={<Landing />} />

                  <Route
                    path="/account"
                    element={
                      <PrivateRoute>
                        <Account />
                      </PrivateRoute>
                    }
                  />

                  <Route element={<NotFound />} />
                </RouterRoutes>
              </Layout.Content>

              <Footer />
            </div>
          </div>

          <Logs />
        </div>
      </SettingsHandler>
    </BrowserRouter>
  </Provider>
);
