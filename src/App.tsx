import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Provider } from "react-redux";

import { store } from "config/store";

import { Header } from "components/Header";
import { Logs } from "components/Logs";
import { PageContent } from "components/PageContent";
import { PrivateRoute } from "components/PrivateRoute";
import { SettingsHandler } from "components/SettingsHandler";

import { Account } from "pages/Account";
import { Landing } from "pages/Landing";
import { NotFound } from "pages/NotFound";

import "./App.scss";

export const App = () => (
  <Provider store={store}>
    <Router>
      <SettingsHandler>
        <div className="Wrapper">
          <div className="Main">
            <Header />

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
          </div>

          <Logs />
        </div>
      </SettingsHandler>
    </Router>
  </Provider>
);
