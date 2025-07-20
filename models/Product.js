const supabase = require('../supabaseClient');

class Product {
  constructor({
    product_id,
    name,
    description,
    price,
    stock_quantity,
    category_id,
    image_url,
    weight = null,
    dimensions = null,
    created_at,
    updated_at
  }) {
    this.product_id = product_id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.stock_quantity = stock_quantity;
    this.category_id = category_id;
    this.image_url = image_url;
    this.weight = weight;
    this.dimensions = dimensions;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static async create(productData) {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();
    if (error) throw error;
    return new Product(data);
  }

  static async findById(product_id) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('product_id', product_id)
      .single();
    if (error) throw error;
    return data ? new Product(data) : null;
  }

  static async findAll() {
    const { data, error } = await supabase
      .from('products')
      .select('*');
    if (error) throw error;
    return data.map(row => new Product(row));
  }

  static async update(product_id, updates) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('product_id', product_id)
      .select()
      .single();
    if (error) throw error;
    return new Product(data);
  }

  static async delete(product_id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('product_id', product_id);
    if (error) throw error;
    return true;
  }
}

module.exports = Product;
