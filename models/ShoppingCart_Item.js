const supabase = require('../supabaseClient');

class ShoppingCartItem {
  constructor({
    cart_item_id,
    cart_id,
    product_id,
    quantity
  }) {
    this.cart_item_id = cart_item_id;
    this.cart_id = cart_id;
    this.product_id = product_id;
    this.quantity = quantity;
  }

  static async create(itemData) {
    const { data, error } = await supabase
      .from('shopping_cart_items')
      .insert([itemData])
      .select()
      .single();
    if (error) throw error;
    return new ShoppingCartItem(data);
  }

  static async findById(cart_item_id) {
    const { data, error } = await supabase
      .from('shopping_cart_items')
      .select('*')
      .eq('cart_item_id', cart_item_id)
      .single();
    if (error) throw error;
    return data ? new ShoppingCartItem(data) : null;
  }

  static async findAllByCartId(cart_id) {
    const { data, error } = await supabase
      .from('shopping_cart_items')
      .select('*')
      .eq('cart_id', cart_id);
    if (error) throw error;
    return data.map(row => new ShoppingCartItem(row));
  }

  static async update(cart_item_id, updates) {
    const { data, error } = await supabase
      .from('shopping_cart_items')
      .update(updates)
      .eq('cart_item_id', cart_item_id)
      .select()
      .single();
    if (error) throw error;
    return new ShoppingCartItem(data);
  }

  static async delete(cart_item_id) {
    const { error } = await supabase
      .from('shopping_cart_items')
      .delete()
      .eq('cart_item_id', cart_item_id);
    if (error) throw error;
    return true;
  }
}

module.exports = ShoppingCartItem;
