const supabase = require('../supabaseClient');

class OrderItem {
  constructor({
    order_item_id,
    order_id,
    product_id,
    quantity,
    price_at_purchase
  }) {
    this.order_item_id = order_item_id;
    this.order_id = order_id;
    this.product_id = product_id;
    this.quantity = quantity;
    this.price_at_purchase = price_at_purchase;
  }

  static async create(orderItemData) {
    const { data, error } = await supabase
      .from('order_items')
      .insert([orderItemData])
      .select()
      .single();
    if (error) throw error;
    return new OrderItem(data);
  }

  static async findById(order_item_id) {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_item_id', order_item_id)
      .single();
    if (error) throw error;
    return data ? new OrderItem(data) : null;
  }

  static async findAllByOrderId(order_id) {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order_id);
    if (error) throw error;
    return data.map(row => new OrderItem(row));
  }

  static async update(order_item_id, updates) {
    const { data, error } = await supabase
      .from('order_items')
      .update(updates)
      .eq('order_item_id', order_item_id)
      .select()
      .single();
    if (error) throw error;
    return new OrderItem(data);
  }

  static async delete(order_item_id) {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('order_item_id', order_item_id);
    if (error) throw error;
    return true;
  }
}

module.exports = OrderItem;
