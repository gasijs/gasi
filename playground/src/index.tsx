/* @refresh reload */
import { render } from "solid-js/web";
import "./index.css";
// import App from './App.tsx'
import App from "./App.solid";

const root = document.getElementById("root");

render(() => <App />, root!);
