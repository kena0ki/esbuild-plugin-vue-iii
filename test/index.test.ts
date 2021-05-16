import fs from 'fs';
import { build } from 'esbuild';
import { vue3Plugin } from '../src';

describe('generate', () => {
  test(`001. esm`, async () => {
    await build({
      entryPoints: ['vite/packages/playground/vue/index.ts'],
      bundle: true,
      sourcemap: true,
      target: ['es2019'],
      outdir: 'test/esm/dist',
      format: 'esm',
      plugins: [vue3Plugin()],
    });
    const indexJs = await fs.promises.readFile('test/esm/dist/index.js','utf-8');
    expect(indexJs).toMatchSnapshot('indexJs');
    const indexCss = await fs.promises.readFile('test/esm/dist/index.css','utf-8');
    expect(indexCss).toMatchSnapshot('indexCss');
  });
  test(`002. iife`, async () => {
    await build({
      entryPoints: ['vite/packages/playground/vue/index.ts'],
      bundle: true,
      sourcemap: true,
      target: ['es2019'],
      outdir: 'test/iife/dist',
      format: 'iife',
      plugins: [vue3Plugin()],
    });
    const indexJs = await fs.promises.readFile('test/iife/dist/index.js','utf-8');
    expect(indexJs).toMatchSnapshot('indexJs');
    const indexCss = await fs.promises.readFile('test/iife/dist/index.css','utf-8');
    expect(indexCss).toMatchSnapshot('indexCss');
  });
});

