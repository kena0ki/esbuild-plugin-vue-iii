import type { Plugin, PluginBuild } from 'esbuild';
import { main } from './main';
import { assets } from './assets';
import type { AssetOptions } from './assets';

/**
 * plugin options
 */
export type Vue3PluginOptions = {
  /**
   * options for resolving static asset reference
   */
  assets?: AssetOptions,
  /**
   * whether resolve asset reference by this plugin
   */
  resolveAssets?: boolean,
};
/**
 * a function to create a plugin
 */
export const vue3Plugin = (opts: Vue3PluginOptions = {}): Plugin => ({
  name: 'vue-iii',
  setup(build: PluginBuild) {
    main(build);
    if (opts.resolveAssets) {
      assets(build, opts.assets);
    }
  },
});

export type { AssetOptions };

