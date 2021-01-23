// rollup.config.js
import { terser } from 'rollup-plugin-terser';

export default [

  {

    // standard JS
    input: './src/datalist-ajax.js',

    output: {
      file: './dist/datalist-ajax.js',
      format: 'es'
    }

  },

  {

    // minified JS
    input: './src/datalist-ajax.js',

    output: {
      file: './dist/datalist-ajax.min.js',
      format: 'es',
      plugins: [
        terser({
          ecma: 2018,
          mangle: {
            toplevel: true,
            reserved: ['AutoComplete']
          },
          compress: {
            module: true,
            toplevel: true,
            unsafe_arrows: true,
            drop_console: true,
            drop_debugger: true
          },
          output: { quote_style: 1 }
        })
      ]
    }

  }

];
