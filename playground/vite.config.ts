import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { gasi } from "../src";

export default defineConfig({
  plugins: [gasi(), solid()],
});
