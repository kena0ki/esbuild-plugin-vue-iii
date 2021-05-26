import fs from 'fs';
import path from 'path';
import type { PluginBuild, PartialMessage, Loader } from 'esbuild';
import {
  SFCBlock,
  SFCScriptCompileOptions,
  SFCStyleCompileOptions,
  SFCTemplateCompileOptions
} from '@vue/compiler-sfc';
// import { createFilter } from '@rollup/pluginutils';
import { parseVueRequest } from '../vite/packages/plugin-vue/src/utils/query';
import { getDescriptor } from '../vite/packages/plugin-vue/src/utils/descriptorCache';
import { getResolvedScript } from '../vite/packages/plugin-vue/src/script';
import { transformMain } from '../vite/packages/plugin-vue/src/main';
import { transformTemplateAsModule } from '../vite/packages/plugin-vue/src/template';
import { transformStyle } from '../vite/packages/plugin-vue/src/style';
import { logger } from './util';

interface Options {
  include?: string | RegExp | (string | RegExp)[]
  exclude?: string | RegExp | (string | RegExp)[]
  isProduction?: boolean
  // options to pass on to @vue/compiler-sfc
  script?: Partial<SFCScriptCompileOptions>
  template?: Partial<SFCTemplateCompileOptions>
  style?: Partial<SFCStyleCompileOptions>
  /**
   * @deprecated the plugin now auto-detects whether it's being invoked for ssr.
   */
  ssr?: boolean
}
interface ResolvedOptions extends Options {
  root: string
  // devServer?: ViteDevServer
}

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

export const main = (build: PluginBuild): void => {
  // transform
  build.onResolve({ filter: /\.vue$/ }, args => ({
    path: args.importer ? path.resolve(args.importer, '..', args.path) : path.resolve(args.path),
    namespace: 'vue-iii-transform',
  }));
  build.onLoad({ filter: /\.vue$/, namespace: 'vue-iii-transform' }, async args => {
    const id = args.path;
    const ssr = false;
    const options: ResolvedOptions = {
      root: process.cwd(),
    };
    const resolveDir = path.dirname(id);
    logger.log('transform', id);
    logger.log('resolveDir', resolveDir);
    const { filename, query } = parseVueRequest(id);
    if (/*(!query.vue && !filter(filename)) ||*/ query.raw) {
      logger.log('transform 1 returned', id);
      return;
    }
    const code = await fs.promises.readFile(args.path, 'utf-8');
    const dummyContext = dummyContextFactory();
    if (!query.vue) {
      // main request
      const ret = await transformMain(code, filename, options, dummyContext, ssr);
      logger.log('transform 2 returned', ret);
      return {
        contents: ret?.code,
        loader: 'ts',
        resolveDir,
        errors: dummyContext.errors
      };
    } else {
      // sub block request
      // transformTemplateAsModule and transformStyle are moved to load section
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
      const descriptor = getDescriptor(filename)!;
      let block: SFCBlock | null | undefined;
      const loader: Loader = 'ts';
      const dummyContext = dummyContextFactory();
      const options: ResolvedOptions = {
        root: process.cwd(),
      };
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
};
