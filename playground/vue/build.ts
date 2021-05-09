import { build } from 'esbuild';
import { vue3Plugin } from 'esbuild-plugin-vue-iii';

build({
  entryPoints: ['index.ts'],
  bundle: true,
  sourcemap: true,
  target: ['es2019'],
  outdir: 'dist',
  format: 'esm',
  plugins: [vue3Plugin()],
}).catch(() => process.exit(1));

