"use strict";
exports.__esModule = true;
var esbuild_1 = require("esbuild");
var esbuild_plugin_vue_iii_1 = require("esbuild-plugin-vue-iii");
esbuild_1.build({
    entryPoints: ['index.ts'],
    bundle: true,
    sourcemap: true,
    target: ['es2019'],
    outdir: 'dist',
    format: 'esm',
    plugins: [esbuild_plugin_vue_iii_1.plugin()]
})["catch"](function () { return process.exit(1); });
