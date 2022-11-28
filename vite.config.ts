import { defineConfig, loadEnv } from "vite";
import createVitePlugins from "./vite";
const path = require("path");
const resolve = (dir) => path.join(__dirname, dir);
import postcsspxtoviewport from "postcss-px-to-viewport";
import autoprefixer from "autoprefixer";