const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const mapsRoutes = require('./routes/mapsRoutes');
const checkInRoutes = require('./routes/checkinRoutes');
const path = require('path');

const app = express();
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Kuma-Revision'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

app.use('/api', userRoutes);
app.use('/api', mapsRoutes);
app.use('/api', checkInRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

module.exports = app;
