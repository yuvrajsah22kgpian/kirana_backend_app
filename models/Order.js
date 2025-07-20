const supabase = require('../supabaseClient');

class Order {
  constructor({
    order_id,
    user_id,
    order_date,
    total_amount,
    currency,
    payment_status,
    shipping_address_line1,
    shipping_address_line2 = null,
    shipping_city,
    shipping_state,
    shipping_zip_code,
    shipping_country,
    shipping_status,
    tracking_number = null,
    shipping_provider = null,
    customer_rating = null,
    customer_review = null,
    created_at,
    updated_at
  }) {
    this.order_id = order_id;
    this.user_id = user_id;
    this.order_date = order_date;
    this.total_amount = total_amount;
    this.currency = currency;
    this.payment_status = payment_status;
    this.shipping_address_line1 = shipping_address_line1;
    this.shipping_address_line2 = shipping_address_line2;
    this.shipping_city = shipping_city;
    this.shipping_state = shipping_state;
    this.shipping_zip_code = shipping_zip_code;
    this.shipping_country = shipping_country;
    this.shipping_status = shipping_status;
    this.tracking_number = tracking_number;
    this.shipping_provider = shipping_provider;
    this.customer_rating = customer_rating;
    this.customer_review = customer_review;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static async create(orderData) {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    if (error) throw error;
    return new Order(data);
  }

  static async findById(order_id) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', order_id)
      .single();
    if (error) throw error;
    return data ? new Order(data) : null;
  }

  static async findAll() {
    const { data, error } = await supabase
      .from('orders')
      .select('*');
    if (error) throw error;
    return data.map(row => new Order(row));
  }

  static async update(order_id, updates) {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('order_id', order_id)
      .select()
      .single();
    if (error) throw error;
    return new Order(data);
  }

  static async delete(order_id) {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('order_id', order_id);
    if (error) throw error;
    return true;
  }
}

module.exports = Order;
