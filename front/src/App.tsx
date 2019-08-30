import React, { useEffect, useState } from "react";
import { Router, RouteComponentProps } from "@reach/router";
import "./App.css";
import Home from "./components/Home";
import { handleAuthentication, login } from "./logic/auth";
import { useAsyncEffect } from "./utils/async-use-effect";

const App = () => {
  const [authentified, setAuthentified] = useState(false);
  useAsyncEffect(async () => {
    console.log("starting async hook effect");
    try {
      const authResult = await handleAuthentication();
      console.log("authResult", authResult);
      if (authResult) {
        setAuthentified(true);
      }
    } catch (err) {
      console.error("Error in asyncHookEffect", err);
      login();
    }
  });
  if (authentified) {
    return (
      <Router>
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
