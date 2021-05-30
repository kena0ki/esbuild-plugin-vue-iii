const build = require('esbuild').build;
const vue3Plugin = require('esbuild-plugin-vue-iii').vue3Plugin;

build({
  entryPoints: ['../vite/packages/playground/vue/index.ts'],
  bundle: true,
  outdir: 'dist',
  plugins: [vue3Plugin()],
  loader: {
    '.png': 'file',
    '.svg': 'file',
  },
  publicPath: '/dist'
}).catch(() => process.exit(1));

