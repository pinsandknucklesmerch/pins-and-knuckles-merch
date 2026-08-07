import { register } from "node:module";

register("./test-alias-loader.mjs", new URL("./", import.meta.url));
