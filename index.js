const express = require('express');
const supabase = require('./supabaseClient');

const orderRoutes = require('./Routes/order');
const productRoutes = require('./Routes/product');
const ratingRoutes = require('./Routes/rating');
const messagesRoutes = require('./Routes/messages');
const queriesRoutes = require('./Routes/queries');
const customersRoutes = require('./Routes/customers');
const notificationRoutes = require('./Routes/notification');
const profileRoutes = require('./Routes/profile');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/orders', orderRoutes);
app.use('/products', productRoutes);
app.use('/ratings', ratingRoutes);
app.use('/messages', messagesRoutes);
app.use('/queries', queriesRoutes);
app.use('/customers', customersRoutes);
app.use('/notifications', notificationRoutes);
app.use('/profile', profileRoutes);

app.get('/', (req, res) => {
  res.send('API is running');
});

async function testConnection() {
  // Try a simple query to check connection
  const { error } = await supabase.from('pg_tables').select('*').limit(1);
  if (error) {
    console.error('Failed to connect to database:', error.message);
  } else {
    console.log('database connected');
  }
}

testConnection();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
