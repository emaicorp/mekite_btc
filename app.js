const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require("cors");
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes')
const messageRoutes = require('./routes/messageRoutes')

dotenv.config();
connectDB();

const app = express();

app.use(cors());

app.use(bodyParser.json());
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// app.use('/api/auth', authRoutes);

module.exports = app;
