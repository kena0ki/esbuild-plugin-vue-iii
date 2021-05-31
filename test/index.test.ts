import { promises as fsp } from 'fs';
import { build } from 'esbuild';
import { vue3Plugin } from '../src';

describe('generate', () => {
  test(`001. esm`, async () => {
    await fsp.rmdir('test/esm/dist', { recursive: true });
    await build({
      entryPoints: ['vite/packages/playground/vue/index.ts'],
      bundle: true,
      sourcemap: true,
      target: ['es2019'],
      outdir: 'test/esm/dist',
      format: 'esm',
      loader: {
        '.png': 'file',
        '.svg': 'file',
      },
      publicPath: '/dist',
      plugins: [vue3Plugin()],
    });
    const indexJs = await fsp.readFile('test/esm/dist/index.js','utf-8');
    expect(indexJs).toMatchSnapshot('indexJs');
    const indexCss = await fsp.readFile('test/esm/dist/index.css','utf-8');
    expect(indexCss).toMatchSnapshot('indexCss');
  });
  test(`002. iife`, async () => {
    await fsp.rmdir('test/iife/dist', { recursive: true });
    await build({
      entryPoints: ['vite/packages/playground/vue/index.ts'],
      bundle: true,
      sourcemap: true,
      target: ['es2019'],
      outdir: 'test/iife/dist',
      format: 'iife',
      loader: {
        '.png': 'file',
        '.svg': 'file',
      },
      publicPath: '/dist',
      plugins: [vue3Plugin()],
    });
    const indexJs = await fsp.readFile('test/iife/dist/index.js','utf-8');
    expect(indexJs).toMatchSnapshot('indexJs');
    const indexCss = await fsp.readFile('test/iife/dist/index.css','utf-8');
    expect(indexCss).toMatchSnapshot('indexCss');
  });
});

