# esbuild-plugin-vue-iii
This is a `esbuild` plugin for vue 3 SFC files (.vue).  
The library is based on the `@vitejs/plugin-vue` internal modules, whose interface is tweaked to suit as a `esbuild` plugin.

## Install
``` sh
npm i -D esbuild-plugin-vue-iii
```
 *) yarn can't be used. yarn seems to be unable to resolve local file dependency well.

## Usage
``` js
const build = require('esbuild').build;
const vue3Plugin =  require('esbuild-plugin-vue-iii').vue3Plugin;

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
 - Template Static Asset Reference
 - Custom Blocks
 - SFC Src Imports
 - Source Map

## Lisence
MIT