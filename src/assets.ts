import type { PluginBuild, PartialMessage, Loader } from 'esbuild';
import type { Vue3PluginOptions } from './index';

/**
 * options for resolving static asset reference
 */
export type AssetOptions = {
  /**
   * specify files to be included using regex
   * @default /\\.(svg|png|jpe?g|gif|ico)(\?.*)?$/
   */
  filter?: RegExp,
  /**
   * a limit file size to bundle content as inline
   * @default 4096
   */
  inlineLimit?: number,
  /**
   * an entry point when resolving absolute paths
   * @default public
   */
  publicDir?: string,
  /**
   * whether use content hash or not
   * @default true
   */
  useContentHash?: boolean,
};

export const assets = (build: PluginBuild, opts: AssetOptions = {}): void => {
  const _opts: Required<AssetOptions> = {
    filter: /\\.(svg|png|jpe?g|gif|ico)(\?.*)?$/i,
    inlineLimit: 4096,
    publicDir: 'public',
    useContentHash: true,
    ...opts
  };
  build.onResolve({ filter: _opts.filter }, args => ({
    namespace: 'vue-iii-assets',
  }));

};
