// dotenv is loaded before any other local require so that modules reading
// process.env at load time (mailer, config/db) see the environment.
// Ordering adopted from PR #7.
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const activityRoutes = require('./routes/activityRoutes'); // --- CATEGORY FEATURE: wiring new module ---
const feedbackResponseRoutes = require('./routes/feedbackResponseRoutes');
const spocRoutes = require('./routes/spocRoutes');

connectDB();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/activities', activityRoutes); // --- CATEGORY FEATURE: wiring new module ---
app.use('/api/spoc', spocRoutes);
// Single authoritative volunteer feedback router: authenticated, volunteer-only,
// verified-volunteer gated on submission. origin/main's anonymous feedbackRoutes
// is deliberately not merged.
app.use('/api/feedback', feedbackResponseRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
