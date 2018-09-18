const path = require('path')

module.exports = {
    entry: {
      app: './public/app/controllers/ctrl.js',
      external: './public/app/externals.js'
    },
    output: {
        path: `${__dirname}/public/app/dist`,
        filename: '[name].js'
    },
    watch: true,
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        }
      ]
    }
}