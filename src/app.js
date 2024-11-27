const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const mapsRoutes = require('./routes/mapsRoutes');
const checkInRoutes = require('./routes/checkinRoutes');
const path = require('path');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api', userRoutes);
app.use('/api', mapsRoutes);
app.use('/api', checkInRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

module.exports = app;
