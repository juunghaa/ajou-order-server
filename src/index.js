require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ 환경 변수 체크
console.log('🔍 Checking environment variables...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

// Routes
try {
  const ordersRouter = require('./routes/orders');
  const cafesRouter = require('./routes/cafes');
  const feedbacksRouter = require('./routes/feedbacks');
  const recommendationsRouter = require('./routes/recommendations');

  app.use('/api/orders', ordersRouter);
  app.use('/api/cafes', cafesRouter);
  app.use('/api/feedbacks', feedbacksRouter);
  app.use('/api/recommendations', recommendationsRouter);
  
  console.log('✅ Routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
}

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'AjouOrder API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      '/api/orders',
      '/api/cafes', 
      '/api/feedbacks',
      '/api/recommendations'
    ]
  });
});

// ✅ 에러 핸들링
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ✅ 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});