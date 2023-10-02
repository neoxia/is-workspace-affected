import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import path from 'node:path';
import url from 'node:url';

// Options
const DIRNAME = path.dirname(url.fileURLToPath(import.meta.url));

/**
 * Config
 * @type import('webpack').Configuration
 */
const commonConfig = {
  devtool: 'source-map',
  target: 'browserslist:node 16',
  entry: './src/index.ts',
  output: {
    filename: 'bundle.cjs',
    path: path.resolve(DIRNAME, 'dist'),
    clean: true,
  },
  optimization: {
    moduleIds: 'deterministic',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /[\\/]node_modules[\\/]/,
        use: 'swc-loader',
      },
      {
        test: /\.json$/,
        type: 'json'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json', '.jsx', '.ts', '.tsx']
  },
  externalsPresets: {
    node: true,
  },
  externals: ['supports-color'],
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        build: true,
        configFile: './tsconfig.build.json'
      }
    })
  ]
};

export default commonConfig;
