const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require("cors");
const connectDB = require('./config/db');
const routes = require('./routes');
dotenv.config();
connectDB();

const app = express();

app.use(cors());

app.use(bodyParser.json());

app.use('/api', routes);

module.exports = app;
