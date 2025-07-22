const express = require('express');
const supabase = require('../supabaseClient');

const router = express.Router();

// Helper function to get current month start and end dates
function getCurrentMonthDates() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return {
    start: startOfMonth.toISOString(),
    end: endOfMonth.toISOString()
  };
}

// Helper function to get current week start and end dates
function getCurrentWeekDates() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return {
    start: startOfWeek.toISOString(),
    end: endOfWeek.toISOString()
  };
}

// Helper function to get today's date range
function getTodayDates() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return {
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString()
  };
}

// Admin Dashboard Overview Endpoint
router.get('/overview', async (req, res) => {
  try {
    const monthDates = getCurrentMonthDates();
    const weekDates = getCurrentWeekDates();
    const todayDates = getTodayDates();

    // Execute all queries in parallel for better performance
    const [
      monthlyOrderResult,
      revenueResult,
      activeCustomersResult,
      productsResult,
      weeklyOrderResult,
      recentOrdersResult
    ] = await Promise.allSettled([
      
      // 1. Count of orders in recent month
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('order_date', monthDates.start)
        .lte('order_date', monthDates.end),

      // 2. Sum of total_amount for revenue in recent month
      supabase
        .from('orders')
        .select('total_amount')
        .gte('order_date', monthDates.start)
        .lte('order_date', monthDates.end),

      // 3. Count of all users
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true }),

      // 4. Count of products
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true }),

      // 5. Count of orders in current week
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('order_date', weekDates.start)
        .lte('order_date', weekDates.end),

      // 6. Recent orders (today's orders with user and shipping details)
      supabase
        .from('orders')
        .select(`
          order_id,
          user_id,
          order_date,
          total_amount,
          currency,
          payment_status,
          shipping_status,
          tracking_number,
          users!inner(
            first_name,
            last_name,
            email
          )
        `)
        .gte('order_date', todayDates.start)
        .lte('order_date', todayDates.end)
        .order('order_date', { ascending: false })
        .limit(20)
    ]);

    // Helper function to process Promise.allSettled results
    const processResult = (result, defaultValue = null) => {
      if (result.status === 'fulfilled' && !result.value.error) {
        return result.value;
      }
      console.error('Query error:', result.reason || result.value?.error);
      return { data: defaultValue === null ? [] : defaultValue, count: 0 };
    };

    // Process results
    const monthlyOrderData = processResult(monthlyOrderResult, 0);
    const revenueData = processResult(revenueResult, []);
    const activeCustomersData = processResult(activeCustomersResult, 0);
    const productsData = processResult(productsResult, 0);
    const weeklyOrderData = processResult(weeklyOrderResult, 0);
    const recentOrdersData = processResult(recentOrdersResult, []);

    // Calculate revenue from total_amount
    const revenue = revenueData.data?.reduce((sum, order) => {
      return sum + (parseFloat(order.total_amount) || 0);
    }, 0) || 0;

    // Format recent orders data
    const formattedRecentOrders = recentOrdersData.data?.map(order => ({
      order_id: order.order_id,
      customer_name: `${order.users?.first_name || ''} ${order.users?.last_name || ''}`.trim(),
      customer_email: order.users?.email || 'N/A',
      order_date: order.order_date,
      total_amount: order.total_amount,
      currency: order.currency,
      payment_status: order.payment_status,
      shipping_status: order.shipping_status,
      tracking_number: order.tracking_number || 'N/A'
    })) || [];

    res.json({
      success: true,
      data: {
        total_orders: monthlyOrderData.count || 0,
        revenue: Math.round(revenue * 100) / 100,
        active_customers: activeCustomersData.count || 0,
        products: productsData.count || 0,
        weekly_orders: weeklyOrderData.count || 0,
        monthly_orders: monthlyOrderData.count || 0,
        recent_orders: formattedRecentOrders
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

// Additional endpoint for detailed analytics
router.get('/analytics', async (req, res) => {
  try {
    const monthDates = getCurrentMonthDates();
    
    // Get daily orders for the current month (for charts)
    const { data: dailyOrders, error } = await supabase
      .from('orders')
      .select('order_date, total_amount')
      .gte('order_date', monthDates.start)
      .lte('order_date', monthDates.end)
      .order('order_date', { ascending: true });

    if (error) throw error;

    // Group orders by day
    const dailyStats = {};
    dailyOrders.forEach(order => {
      const date = order.order_date.split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { orders: 0, revenue: 0 };
      }
      dailyStats[date].orders++;
      dailyStats[date].revenue += parseFloat(order.total_amount) || 0;
    });

    res.json({
      success: true,
      data: {
        daily_stats: dailyStats,
        period: monthDates
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics data',
      message: error.message
    });
  }
});

// Endpoint to get top products
router.get('/top-products', async (req, res) => {
  try {
    const monthDates = getCurrentMonthDates();

    // Get order items from current month with product details
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        order_item_id,
        product_id,
        quantity,
        price_at_purchase,
        orders!inner(
          order_date
        ),
        products!inner(
          name,
          price
        )
      `)
      .gte('orders.order_date', monthDates.start)
      .lte('orders.order_date', monthDates.end);

    if (orderItemsError) throw orderItemsError;

    // Group by product and calculate totals
    const productStats = {};
    orderItems.forEach(item => {
      const productId = item.product_id;
      const quantity = item.quantity || 1;
      const priceAtPurchase = parseFloat(item.price_at_purchase) || 0;
      
      if (!productStats[productId]) {
        productStats[productId] = {
          product_id: productId,
          name: item.products?.name || 'Unknown',
          current_price: item.products?.price || 0,
          total_quantity: 0,
          total_orders: 0,
          total_revenue: 0
        };
      }
      
      productStats[productId].total_quantity += quantity;
      productStats[productId].total_orders++;
      productStats[productId].total_revenue += priceAtPurchase * quantity;
    });

    // Convert to array and sort by total_revenue
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 10)
      .map(product => ({
        ...product,
        total_revenue: Math.round(product.total_revenue * 100) / 100
      }));

    res.json({
      success: true,
      data: topProducts
    });

  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top products',
      message: error.message
    });
  }
});

// Endpoint for order status distribution
router.get('/order-status', async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('payment_status, shipping_status');

    if (error) throw error;

    const paymentStatusStats = {};
    const shippingStatusStats = {};

    orders.forEach(order => {
      // Count payment statuses
      const paymentStatus = order.payment_status || 'unknown';
      paymentStatusStats[paymentStatus] = (paymentStatusStats[paymentStatus] || 0) + 1;

      // Count shipping statuses
      const shippingStatus = order.shipping_status || 'unknown';
      shippingStatusStats[shippingStatus] = (shippingStatusStats[shippingStatus] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        payment_status_distribution: paymentStatusStats,
        shipping_status_distribution: shippingStatusStats,
        total_orders: orders.length
      }
    });

  } catch (error) {
    console.error('Order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order status data',
      message: error.message
    });
  }
});

module.exports = router;
