require('dotenv').config();
const express = require('express');
const chalk = require('chalk');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

const keys = require('./config/keys');
const routes = require('./routes');
const socket = require('./socket');
const setupDB = require('./utils/db');

const { port } = keys;
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: true
  })
);
app.use(cors());
app.use(express.static(path.resolve(__dirname, '../dist')));

setupDB();
require('./config/passport')(app);
app.use(routes);

console.log('process.env.NODE_ENV ', process.env.NODE_ENV);
if (process.env.NODE_ENV === 'production') {
  app.use(compression());
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist/index.html'));
  });
}

module.exports = app;
