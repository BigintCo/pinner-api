const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const mapsRoutes = require('./routes/mapsRoutes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api', userRoutes);
app.use('/api', mapsRoutes);

module.exports = app;
