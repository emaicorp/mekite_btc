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
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: err.message 
  });
});

module.exports = app;
