import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { initStore } from "./logic/store";
import { EventEmitter } from "events";
import localforage from "localforage";
import { initController } from "./logic/controller";

const App: React.FC = () => {
  const appElement = document.getElementById("app");
  const appVersion = appElement
    ? appElement.getAttribute("data-app-version") || ""
    : "";
  const apiEndpoint = appElement
    ? appElement.getAttribute("data-api-endpoint") || ""
    : "";
  const events = new EventEmitter();
  const store = initStore("documents", events, apiEndpoint, localforage);
  initController(store);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
};

export default App;
