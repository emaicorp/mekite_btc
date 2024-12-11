const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require("cors");
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const admin = require('./routes/admin');

dotenv.config();
connectDB();

const app = express();

app.use(cors());

app.use(bodyParser.json());
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', admin); // Admin routes are now accessible under '/api/admin'
// app.use('/api/auth', authRoutes);

module.exports = app;
