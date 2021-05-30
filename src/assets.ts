import path from 'path';
import { promises as fsp } from 'fs';
import { createHash } from 'crypto';
import { cleanUrl } from './util';
import type { PluginBuild } from 'esbuild';

/**
 * options for resolving static asset reference
 */
export type AssetOptions = {
  /**
   * extensions to be resolved by this plugin
   * @default svg, png, jpg, jpeg, gif, ico
   */
  extensions?: string[],
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
    extensions: ['svg', 'png', 'jpg', 'jpeg', 'gif', 'ico'],
    inlineLimit: 4096,
    publicDir: 'public',
    useContentHash: true,
    ...opts
  };
  const filter = new RegExp('\\.(' + _opts.extensions.join('|') + ')(\\?.*)?$', 'i');
  const orginalLoader = build.initialOptions.loader;
  const pluginLoader = _opts.extensions.reduce((curr, next) =>  {
    curr[next] = next === 'svg' ? 'text' : 'dataURL', {}; // eslint-disable-line no-param-reassign
    return curr;
  }, {});
  build.initialOptions.loader = { ...orginalLoader, ...pluginLoader }; // eslint-disable-line no-param-reassign
  build.onResolve({ filter }, async args => {
    const filename = cleanUrl(args.path);
    const filepath = args.path.startsWith('/') && opts.publicDir ? path.join(opts.publicDir, filename) :
                     args.importer ? path.resolve(args.importer, '..', filename) : filename;
    const stat = await fsp.stat(filepath);
    if ( _opts.inlineLimit <= stat.size) {
      return {
        path: filepath,
        namespace: 'file', // use default esbuild loader
      };
    }
    return {
      path: filepath,
      namespace: 'vue-iii-assets',
    };
  });
  build.onLoad({ filter, namespace: 'vue-iii-assets' }, async args => {
    const { outdir, outfile } = build.initialOptions;
    const _outdir = outdir || (outfile && path.dirname(outfile));
    if (!_outdir) {
      return {
        errors: [{
          pluginName: args.namespace,
          text: 'One of outdir or outfile should be specified.',
        }],
      };
    }
    try {
      const hash = (async () => {
        if (opts.useContentHash) {
          const content = await fsp.readFile(args.path);
          return createHash('sha256').update(content).digest('hex').slice(0,8);
        }
        return '';
      });
      const basename = path.basename(args.path);
      const ext = path.extname(basename);
      const filename = `${basename.slice(0, -ext.length)}.${hash}${ext}`;
      const destname = path.join(_outdir, filename);
      await fsp.copyFile(args.path, destname);
      return {
        contents: filename,
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        return {
          errors: [{
            pluginName: args.namespace,
            text: err.message,
            detail: err.stack
          }],
        };
      }
      return {
        errors: [{
          pluginName: args.namespace,
          text: 'Unknown error occured',
        }],
      };
    }
  });
};
