import React, { useState } from "react";
import { Router, RouteComponentProps } from "@reach/router";
import "./App.css";
import Home from "./components/Home";
import { handleAuthentication, login } from "./logic/auth";
import { useAsyncEffect } from "./utils/async-use-effect";
import Header from "./components/Header";

const App = () => {
  const [authentified, setAuthentified] = useState(false);
  useAsyncEffect(async () => {
    try {
      const authResult = await handleAuthentication();
      if (authResult) {
        setAuthentified(true);
        window.location.hash = '';
      }
    } catch (err) {
      console.error("login error", err);
      login();
    }
  });
  if (authentified) {
    return (
      <Router>
         <Header />
        <RouterPage path="/" pageComponent={<Home></Home>} />
      </Router>
    );
  } else {
    return <div>Loading ...</div>;
  }
};

export default App;

const RouterPage = (
  props: { pageComponent: JSX.Element } & RouteComponentProps
) => props.pageComponent;
