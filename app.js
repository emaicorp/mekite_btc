const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
// const adminRoutes = require('./routes/adminRoutes');
// const authRoutes = require('./routes/authRoutes');

dotenv.config();
connectDB();

const app = express();

app.use(bodyParser.json());
app.use('/api/users', userRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/auth', authRoutes);

module.exports = app;
