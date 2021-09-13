import fs from 'fs';
import path from 'path';
// import { createFilter } from '@rollup/pluginutils';
import {
  SFCBlock,
  SFCScriptCompileOptions,
  SFCStyleCompileOptions,
  SFCTemplateCompileOptions,
  shouldTransformRef,
  // transformRef,
} from '@vue/compiler-sfc';
import { parseVueRequest } from '../vite/packages/plugin-vue/src/utils/query';
import { getDescriptor } from '../vite/packages/plugin-vue/src/utils/descriptorCache';
import { getResolvedScript } from '../vite/packages/plugin-vue/src/script';
import { transformMain } from '../vite/packages/plugin-vue/src/main';
// import { handleHotUpdate } from '../vite/packages/plugin-vue/src/handleHotUpdate';
import { transformTemplateAsModule } from '../vite/packages/plugin-vue/src/template';
import { transformStyle } from '../vite/packages/plugin-vue/src/style';
import type { PluginBuild, PartialMessage, Loader } from 'esbuild';

export interface Options {
  // include?: string | RegExp | (string | RegExp)[]
  // exclude?: string | RegExp | (string | RegExp)[]

  isProduction?: boolean

  // options to pass on to @vue/compiler-sfc
  script?: Partial<SFCScriptCompileOptions>
  template?: Partial<SFCTemplateCompileOptions>
  style?: Partial<SFCStyleCompileOptions>

  /**
   * Transform Vue SFCs into custom elements.
   * **requires Vue \>= 3.2.0 & Vite \>= 2.4.4**
   * - `true`: all `*.vue` imports are converted into custom elements
   * - `string | RegExp`: matched files are converted into custom elements
   *
   * @default /\.ce\.vue$/
   */
  // customElement?: boolean | string | RegExp | (string | RegExp)[]

  /**
   * Enable Vue ref transform (experimental).
   * https://github.com/vuejs/vue-next/tree/master/packages/ref-transform
   *
   * **requires Vue \>= 3.2.5**
   *
   * - `true`: transform will be enabled for all vue,js(x),ts(x) files except
   *           those inside node_modules
   * - `string | RegExp`: apply to vue + only matched files (will include
   *                      node_modules, so specify directories in necessary)
   * - `false`: disable in all cases
   *
   * @default false
   */
  // refTransform?: boolean | string | RegExp | (string | RegExp)[]

  /**
   * @deprecated the plugin now auto-detects whether it's being invoked for ssr.
   */
  // ssr?: boolean
}
export interface ResolvedOptions extends Options {
  root: string
  include,
  exclude,
  customElement,
  refTransform,
  // devServer?: ViteDevServer
}

const logger = {
  log: process.env.NODE_ENV === 'dev' ? console.log : () => {},
};

const AbsolutePath = /^(?:\/|(?:[A-Za-z]:)?[\\|/])/;
const dummyContextFactory = (): any => {
  const errors: PartialMessage[] = [];
  return {
    resolve(src: string, importer: string): { id: string } | undefined {
      if (AbsolutePath.test(src)) {
        logger.log('resolve abs:', src);
        return { id: src };
      } else if (src[0] === '.') { // is relative path
        logger.log('resolve rel:', importer ? path.resolve(importer, '..', src) : path.resolve(src));
        return { id: importer ? path.resolve(importer, '..', src) : path.resolve(src) };
      }
    },
    error(param: {
      id: string,
      message: string,
      loc?: {
        column: number,
        file?: string,
        line: number,
      },
    }) {
      errors.push({
        location: {
          file: param.loc?.file || param.id,
          column: param.loc?.column,
          line: param.loc?.line,
        },
        text: param.message,
      });
    },
    get errors() {
      return errors;
    },
  };
};

// const filter = createFilter(
//   rawOptions.include || /\.vue$/,
//   rawOptions.exclude
// )
const createFilter = (include?:RegExp, exclude?:any) => // eslint-disable-line @typescript-eslint/no-unused-vars
  (name: string) => !!include?.test(name);
export const vue3Plugin = (rawOptions: Options ={}) => {
  // const {
  //   include = /\.vue$/,
  //   exclude,
  //   customElement = /\.ce\.vue$/,
  //   refTransform = false
  // } = rawOptions;
  const include = /\.vue$/;
  const exclude = undefined;
  const customElement = undefined;
  const refTransform = undefined;
  const filter = createFilter(include, exclude);// eslint-disable-line @typescript-eslint/no-unused-vars
  const customElementFilter =// eslint-disable-line @typescript-eslint/no-unused-vars
    typeof customElement === 'boolean'
      ? () => customElement
      : createFilter(customElement);
  const refTransformFilter =// eslint-disable-line @typescript-eslint/no-unused-vars
    refTransform === false
      ? () => false
      : refTransform === true
      ? createFilter(/\.(j|t)sx?$/, /node_modules/)
      : createFilter(refTransform);
  // compat for older verisons
  const canUseRefTransform = typeof shouldTransformRef === 'function';// eslint-disable-line @typescript-eslint/no-unused-vars

  const options: ResolvedOptions = {
    isProduction: process.env.NODE_ENV === 'production',
    ...rawOptions,
    include,
    exclude,
    customElement,
    refTransform,
    root: process.cwd(),
  };

  return {
    name: 'vue-iii',
    setup(build: PluginBuild) {

      // transform
      build.onResolve({ filter: /\.vue$/ }, args => ({
        path: args.importer ? path.resolve(args.importer, '..', args.path) : path.resolve(args.path),
        namespace: 'vue-iii-transform',
      }));
      build.onLoad({ filter: /\.vue$/, namespace: 'vue-iii-transform' }, async args => {
        const id = args.path;
        const ssr = false;
        const resolveDir = path.dirname(id);
        logger.log('transform', id);
        logger.log('resolveDir', resolveDir);
        const { filename, query } = parseVueRequest(id);
        if (query.raw) {
          logger.log('transform 1 returned', id);
          return;
        }
        // if (!filter(filename) && !query.vue) {
        //   if (!query.vue && refTransformFilter(filename)) {
        //     if (!canUseRefTransform) {
        //       this.warn('refTransform requires @vue/compiler-sfc@^3.2.5.')
        //     } else if (shouldTransformRef(code)) {
        //       return transformRef(code, {
        //         filename,
        //         sourceMap: true
        //       })
        //     }
        //   }
        //   return
        // }
        const code = await fs.promises.readFile(args.path, 'utf-8');
        const dummyContext = dummyContextFactory();
        if (!query.vue) {
          // main request
          const ret = await transformMain(
            code,
            filename,
            options,
            dummyContext,
            ssr,
            // customElementFilter(filename)
            false,
          );
          logger.log('transform 2 returned', ret);
          return {
            contents: ret?.code,
            loader: 'ts',
            resolveDir,
            errors: dummyContext.errors
          };
        } else {
          // sub block request is done in the load section
        }
      });

      // load
      build.onResolve({ filter: /\.vue\?/ }, args => {
        // serve subpart requests (*?vue) as virtual modules
        if (parseVueRequest(args.path).query.vue) {
          return {
            path: args.importer ? path.resolve(args.importer, '..', args.path) : path.resolve(args.path),
            namespace: 'vue-iii-load',
          };
        }
      });
      build.onLoad({ filter: /\.vue\?/, namespace: 'vue-iii-load' }, async args => {
        const id = args.path;
        const ssr = false;
        const { filename, query } = parseVueRequest(id);
        const resolveDir = path.dirname(id.split('?')[0]);
        logger.log('resolveDir', resolveDir);
        // select corresponding block for subpart virtual modules
        if (query.vue) {
          if (query.src) {
            logger.log('load 1 returned', id);
            return { contents: await fs.promises.readFile(filename, 'utf-8'), loader: 'ts', resolveDir };
          }
          const descriptor = getDescriptor(
            filename,
            options.root,
            options.isProduction,
          )!;
          let block: SFCBlock | null | undefined;
          const loader: Loader = 'ts';
          const dummyContext = dummyContextFactory();
          if (query.type === 'script') {
            // handle <scrip> + <script setup> merge via compileScript()
            block = getResolvedScript(descriptor, ssr);
          } else if (query.type === 'template') {
            block = descriptor.template!;
            const ret = transformTemplateAsModule(block.content, descriptor, options, dummyContext, ssr);
            logger.log('transform 3 returned', ret);
            return {
              contents: ret?.code,
              loader,
              resolveDir,
              errors: dummyContext.errors
            };
          } else if (query.type === 'style') {
            block = descriptor.styles[query.index!];
            const ret = await transformStyle(
              block.content,
              descriptor,
              Number(query.index),
              options,
              dummyContext
            );
            logger.log('transform 4 returned', ret);
            return {
              contents: ret?.code,
              loader: 'css',
              resolveDir,
              errors: dummyContext.errors
            };
          } else if (query.index != null) {
            block = descriptor.customBlocks[query.index];
          }
          if (block) {
            logger.log('load 2 returned', id, block);
            return {
              contents: block.content,
              loader,
              resolveDir,
            };
          }
        }
      });
    },
  };
};
