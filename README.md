# esbuild-plugin-vue-iii
This is a `esbuild` plugin for vue 3 SFC files (.vue).  
The library is based on the `@vitejs/plugin-vue` internal modules, whose interface is tweaked to suit as a `esbuild` plugin.

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
 - ~~Template Static Asset Reference~~ -> esbuild built-in options can be used for this feature. See [issue#1](https://github.com/kena0ki/esbuild-plugin-vue-iii/issues/1).
 - Custom Blocks
 - SFC Src Imports
 - Source Map

## License
MIT