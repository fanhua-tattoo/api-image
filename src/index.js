'use strict';

require('dotenv').config({ silent: true });
const Koa = require('koa');
const route = require('koa-route');
const middlewares = require('./middlewares');
const bodyParser = require('koa-bodyparser');
const helmet = require('koa-helmet');
const cors = require('koa-cors');
const logger = require('koa-logger');
const convert = require('koa-convert');


const app = module.exports = new Koa();


app.use(logger());
app.use(convert(cors()));
app.use(helmet());
app.use(bodyParser());


app.use(route.get('/index', middlewares.fetchIndex({ root: process.env.IMAGE_LIBRARY_ROOT })));
app.use(route.get('/image', middlewares.fetchImage({ root: process.env.IMAGE_LIBRARY_ROOT })));


if (!module.parent) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`service listen on port ${port}`)); // eslint-disable-line
}
