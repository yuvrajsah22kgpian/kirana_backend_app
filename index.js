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

// Supabase connection test function
async function isSupabaseConnected(supabase) {
  try {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    return !error;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
}

// Function to start the server
async function startServer() {
  try {
    // Test Supabase connection before starting the server
    const connected = await isSupabaseConnected(supabase);
    console.log(`Supabase Connected: ${connected ? '✅ Yes' : '❌ No'}`);
    
    if (!connected) {
      console.warn('⚠️ Warning: Supabase connection failed, but server will still start');
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API endpoint: http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1); // Exit if there's a critical error
  }
}

// Start the server
startServer();
