import React from "react";
import { Router, RouteComponentProps } from "@reach/router"
import "./App.css";
import Home from "./components/Home";

const App: React.FC = () => {
  return <Router>
            <RouterPage path="/" pageComponent={<Home></Home>}/>
          </Router>
};

export default App;

const RouterPage = (
  props: { pageComponent: JSX.Element } & RouteComponentProps
) => props.pageComponent;
