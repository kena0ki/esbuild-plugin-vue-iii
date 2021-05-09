import { build } from 'esbuild';
import { plugin } from 'esbuild-plugin-vue-iii';

build({
  entryPoints: ['index.ts'],
  bundle: true,
  sourcemap: true,
  target: ['es2019'],
  outdir: 'dist',
  format: 'esm',
  plugins: [plugin()],
}).catch(() => process.exit(1));

