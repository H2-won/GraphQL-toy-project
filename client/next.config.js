const path = require('path');

module.exports = {
  swcMinify: true,
  sassOptions: {
    includePaths: [path.resolve(__dirname, './pages')],
  },
};
