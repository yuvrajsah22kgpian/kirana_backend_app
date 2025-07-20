const supabase = require('../supabaseClient');

class ShoppingCart {
  constructor({
    cart_id,
    user_id,
    created_at,
    updated_at
  }) {
    this.cart_id = cart_id;
    this.user_id = user_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static async create(cartData) {
    const { data, error } = await supabase
      .from('shopping_carts')
      .insert([cartData])
      .select()
      .single();
    if (error) throw error;
    return new ShoppingCart(data);
  }

  static async findById(cart_id) {
    const { data, error } = await supabase
      .from('shopping_carts')
      .select('*')
      .eq('cart_id', cart_id)
      .single();
    if (error) throw error;
    return data ? new ShoppingCart(data) : null;
  }

  static async findByUserId(user_id) {
    const { data, error } = await supabase
      .from('shopping_carts')
      .select('*')
      .eq('user_id', user_id)
      .single();
    if (error) throw error;
    return data ? new ShoppingCart(data) : null;
  }

  static async update(cart_id, updates) {
    const { data, error } = await supabase
      .from('shopping_carts')
      .update(updates)
      .eq('cart_id', cart_id)
      .select()
      .single();
    if (error) throw error;
    return new ShoppingCart(data);
  }

  static async delete(cart_id) {
    const { error } = await supabase
      .from('shopping_carts')
      .delete()
      .eq('cart_id', cart_id);
    if (error) throw error;
    return true;
  }
}

module.exports = ShoppingCart;
