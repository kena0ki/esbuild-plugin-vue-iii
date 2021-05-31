# esbuild-plugin-vue-iii
This is a `esbuild` plugin for vue 3 SFC files (.vue).  
This plugin is based on the `@vitejs/plugin-vue` internal modules, whose interface is tweaked to suit a `esbuild` plugin.  
An experimental feature [`<script setup>`](https://github.com/vuejs/rfcs/blob/script-setup-2/active-rfcs/0000-script-setup.md) is supported.


## Install
``` sh
npm i -D esbuild esbuild-plugin-vue-iii
```

## Usage
``` js
const build = require('esbuild').build;
const vue3Plugin = require('esbuild-plugin-vue-iii').vue3Plugin;

build({
  entryPoints: ['index.ts'],
  bundle: true,
  outdir: 'dist',
  plugins: [vue3Plugin()],
}).catch(() => process.exit(1));
```

## Not (yet) supported
 - Pre-Processors
 - CSS Modules  
 - ~~Template Static Asset Reference~~ -> esbuild built-in options is used for this feature. See [issue#1](https://github.com/kena0ki/esbuild-plugin-vue-iii/issues/1).
 - Custom Blocks
 - SFC Src Imports
 - Source Map

## Development
  - Main project set up
```sh
npm run setup-submodule
npm i
```
  - Start the demo
```sh
cd demo
npm run build
npm run serve
```

## License
MIT