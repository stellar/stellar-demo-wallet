import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Provider } from "react-redux";
import * as Sentry from "@sentry/browser";
import { Integrations } from "@sentry/tracing";

import { store } from "config/store";
import { Header } from "components/Header";
import { Footer } from "components/Footer";
import { Logs } from "components/Logs";
import { PageContent } from "components/PageContent";
import { PrivateRoute } from "components/PrivateRoute";
import { SettingsHandler } from "components/SettingsHandler";
import { WarningBanner } from "components/WarningBanner";
import { TextLink } from "components/TextLink";

import { Account } from "pages/Account";
import { Landing } from "pages/Landing";
import { NotFound } from "pages/NotFound";
import "./App.scss";

if (process.env.REACT_APP_SENTRY_KEY) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_KEY,
    release: `demo-wallet@${process.env.npm_package_version}`,
    integrations: [
      new Integrations.BrowserTracing({
        // not attaching sentry-trace to any XHR/fetch outgoing requests
        tracingOrigins: [],
      }),
    ],
    tracesSampleRate: 1.0,
  });
}

export const App = () => (
  <Provider store={store}>
    <Router>
      <SettingsHandler>
        <WarningBanner />

        <div id="app-wrapper" className="Wrapper">
          <div className="SplitContainer Main">
            <div className="ContentWrapper">
              <Header />

              <div className="IntroText Inset">
                <p>
                  This demo wallet lets financial application developers test
                  their integrations and learn how Stellar ecosystem protocols
                  (SEPs) work.
                </p>

                <p>
                  <TextLink
                    href="https://github.com/stellar/stellar-demo-wallet#stellar-demo-wallet"
                    isExternal
                  >
                    Learn more
                  </TextLink>{" "}
                  about the tool and{" "}
                  <TextLink
                    href="https://github.com/stellar/stellar-demo-wallet/issues"
                    isExternal
                  >
                    report issues or request features
                  </TextLink>{" "}
                  on GitHub.
                </p>
              </div>

              <PageContent>
                <Switch>
                  <Route exact path="/">
                    <Landing />
                  </Route>

                  <PrivateRoute exact path="/account">
                    <Account />
                  </PrivateRoute>

                  <Route component={NotFound} />
                </Switch>
              </PageContent>

              <Footer />
            </div>
          </div>

          <Logs />
        </div>
      </SettingsHandler>
    </Router>
  </Provider>
);
