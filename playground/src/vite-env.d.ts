/// <reference types="vite/client" />

declare module "*.solid" {
  import { Component } from "solid-js";
  const component: Component;

  export default component;
}
