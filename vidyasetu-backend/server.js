const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');
const crmRoutes = require('./routes/crmRoutes');
const studentRoutes = require('./routes/studentRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { database, initDB } = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/', authRoutes);
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);
app.use('/api/admin', crmRoutes);
app.use('/', studentRoutes);
app.use('/health', healthRoutes);

initDB();

const startServer = () => {
  database.pragma('journal_mode = WAL');

  return app.listen(PORT, () => {
    console.log(`LMS backend is running on port ${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
};
