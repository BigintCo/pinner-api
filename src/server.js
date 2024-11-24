require('dotenv').config();
const { connectDB } = require('./config/db');
const app = require('./app');

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(error => {
  console.error("Failed to connect to database:", error);
});
