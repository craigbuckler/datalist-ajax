import { copyFile } from 'node:fs/promises';
import esbuild from 'esbuild';

const buildJS = await esbuild.context({

  entryPoints: [ './src/datalist-ajax.js' ],
  format: 'esm',
  bundle: true,
  target: (process.env.BROWSER_TARGET || '').split(','),
  external: [],
  drop: ['debugger', 'console'],
  minify: true,
  sourcemap: false,
  outdir: './dist/'

});

await buildJS.rebuild();
buildJS.dispose();

await copyFile('./dist/datalist-ajax.js', './dist/datalist-ajax.min.js');
await copyFile('./src/datalist-ajax.js', './dist/datalist-ajax.js');
