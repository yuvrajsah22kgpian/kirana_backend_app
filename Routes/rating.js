const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// GET /ratings - rating dashboard
router.get('/', async (req, res) => {
  try {
    // 1. Overall rating (average of customer_rating in Order table)
    const { data: ratingsData, error: ratingsError } = await supabase
      .from('orders')
      .select('customer_rating')
      .not('customer_rating', 'is', null);
    
    if (ratingsError) throw ratingsError;
    
    const ratings = ratingsData.map(r => r.customer_rating).filter(r => r !== null && r >= 1 && r <= 5);
    const overall_rating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;

    // 2. Rating distribution (count of each rating 1-5) - return as object with keys "1", "2", "3", "4", "5"
    const rating_distribution = {
      "1": ratings.filter(r => r === 1).length,
      "2": ratings.filter(r => r === 2).length,
      "3": ratings.filter(r => r === 3).length,
      "4": ratings.filter(r => r === 4).length,
      "5": ratings.filter(r => r === 5).length
    };

    // 3. Recent activity - For this we'll create a custom logic based on review presence and order status
    // Since there's no review_status field in the model, we'll categorize based on order data
    const { data: reviewData, error: reviewError } = await supabase
      .from('orders')
      .select('order_id, customer_review, customer_rating, shipping_status, created_at')
      .not('customer_review', 'is', null);
    
    if (reviewError) throw reviewError;

    // Get recent orders (last 30 days) for activity calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReviews = reviewData.filter(order => 
      new Date(order.created_at) >= thirtyDaysAgo
    );

    const recent_activity = {
      newReviews: recentReviews.filter(r => 
        r.customer_review && !r.customer_rating // Has review but no rating yet
      ).length,
      underreview: recentReviews.filter(r => 
        r.customer_review && r.customer_rating && r.shipping_status === 'shipped'
      ).length,
      flagged: recentReviews.filter(r => 
        r.customer_rating && r.customer_rating <= 2 // Low ratings flagged for review
      ).length,
      published: recentReviews.filter(r => 
        r.customer_review && r.customer_rating && r.shipping_status === 'delivered'
      ).length
    };

    // 4. All reviews - join Order, User, Order_Item, and Product tables
    // Step 1: Get orders with reviews
    const { data: ordersWithReviews, error: ordersError } = await supabase
      .from('orders')
      .select('order_id, customer_rating, customer_review, user_id, created_at')
      .not('customer_review', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100); // Limit to prevent large response

    if (ordersError) throw ordersError;

    if (ordersWithReviews.length === 0) {
      return res.json({
        overall_rating: Math.round(overall_rating * 100) / 100,
        rating_distribution,
        recent_activity,
        allreviews: []
      });
    }

    // Step 2: Get user details from User table
    const userIds = [...new Set(ordersWithReviews.map(orders => orders.user_id))];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, email')
      .in('user_id', userIds);

    if (usersError) throw usersError;

    // Create user lookup object
    const userLookup = users.reduce((acc, user) => {
      acc[user.user_id] = {
        username: `${user.first_name} ${user.last_name}`.trim() || 'Unknown User',
        email: user.email || 'No Email'
      };
      return acc;
    }, {});

    // Step 3: Get order items from Order_Item table
    const orderIds = ordersWithReviews.map(orders => orders.order_id);
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('order_item_id, order_id, product_id, quantity, price_at_purchase')
      .in('order_id', orderIds);

    if (orderItemsError) throw orderItemsError;

    // Step 4: Get product details from Product table
    const productIds = [...new Set(orderItems.map(item => item.product_id))];
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('product_id, name, price')
      .in('product_id', productIds);

    if (productsError) throw productsError;

    // Create lookup objects
    const productLookup = products.reduce((acc, product) => {
      acc[product.product_id] = product;
      return acc;
    }, {});

    // Group order items by order_id (in case an order has multiple items)
    const orderItemLookup = orderItems.reduce((acc, item) => {
      if (!acc[item.order_id]) {
        acc[item.order_id] = [];
      }
      acc[item.order_id].push(item);
      return acc;
    }, {});

    // Step 5: Join all data together
    const allreviews = ordersWithReviews.map(orders => {
      const users = userLookup[orders.user_id] || { username: 'Unknown User', email: 'No Email' };
      const orderItemsForOrder = orderItemLookup[orders.order_id] || [];
      
      // Get the first product (or combine multiple products)
      let productName = 'Unknown Product';
      if (orderItemsForOrder.length > 0) {
        const firstItem = orderItemsForOrder[0];
        const product = productLookup[firstItem.product_id];
        if (product) {
          productName = product.name;
          // If multiple products, show count
          if (orderItemsForOrder.length > 1) {
            productName += ` (+${orderItemsForOrder.length - 1} more)`;
          }
        }
      }

      return {
        username: users.username,
        email: users.email,
        orderid: orders.order_id,
        rating: orders.customer_rating,
        reviews: orders.customer_review,
        product_name: productName
      };
    });

    // Return response in exact format requested
    res.json({
      overall_rating: Math.round(overall_rating * 100) / 100,
      rating_distribution,
      recent_activity,
      allreviews
    });

  } catch (error) {
    console.error('Rating dashboard error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch rating data',
      message: error.message 
    });
  }
});

// Additional endpoint to get detailed rating statistics
router.get('/stats', async (req, res) => {
  try {
    // Get rating trends over time
    const { data: ratingTrends, error } = await supabase
      .from('orders')
      .select('customer_rating, created_at')
      .not('customer_rating', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;

    // Group ratings by month
    const monthlyRatings = {};
    ratingTrends.forEach(order => {
      const month = new Date(order.created_at).toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyRatings[month]) {
        monthlyRatings[month] = { total: 0, count: 0 };
      }
      monthlyRatings[month].total += order.customer_rating;
      monthlyRatings[month].count += 1;
    });

    // Calculate monthly averages
    const monthlyAverages = Object.keys(monthlyRatings).map(month => ({
      month,
      average: Math.round((monthlyRatings[month].total / monthlyRatings[month].count) * 100) / 100,
      count: monthlyRatings[month].count
    })).sort((a, b) => b.month.localeCompare(a.month));

    res.json({
      success: true,
      data: {
        monthlyAverages: monthlyAverages.slice(0, 12), // Last 12 months
        totalReviews: ratingTrends.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rating statistics',
      message: error.message
    });
  }
});

// Endpoint to get reviews for a specific product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // Get orders containing this product with reviews
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        order_id,
        product_id,
        quantity,
        price_at_purchase
      `)
      .eq('product_id', productId);

    if (itemsError) throw itemsError;

    const orderIds = orderItems.map(item => item.order_id);
    
    if (orderIds.length === 0) {
      return res.json({
        success: true,
        data: {
          product_reviews: [],
          average_rating: 0,
          total_reviews: 0
        }
      });
    }

    // Get orders with reviews for these order IDs
    const { data: ordersWithReviews, error: ordersError } = await supabase
      .from('orders')
      .select(`
        order_id,
        user_id,
        customer_rating,
        customer_review,
        created_at
      `)
      .in('order_id', orderIds)
      .not('customer_review', 'is', null);

    if (ordersError) throw ordersError;

    // Get user details
    const userIds = [...new Set(ordersWithReviews.map(order => order.user_id))];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, email')
      .in('user_id', userIds);

    if (usersError) throw usersError;

    const userLookup = users.reduce((acc, user) => {
      acc[user.user_id] = {
        username: `${user.first_name} ${user.last_name}`.trim(),
        email: user.email
      };
      return acc;
    }, {});

    const product_reviews = ordersWithReviews.map(orders => ({
      username: userLookup[orders.user_id]?.username || 'Unknown User',
      email: userLookup[orders.user_id]?.email || 'No Email',
      orderid: orders.order_id,
      rating: orders.customer_rating,
      reviews: orders.customer_review,
      created_at: orders.created_at
    }));

    const ratings = ordersWithReviews.map(orders => orders.customer_rating).filter(r => r !== null);
    const average_rating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    res.json({
      success: true,
      data: {
        product_reviews,
        average_rating: Math.round(average_rating * 100) / 100,
        total_reviews: product_reviews.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product reviews',
      message: error.message
    });
  }
});

module.exports = router;
