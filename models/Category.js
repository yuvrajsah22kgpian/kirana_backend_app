const supabase = require('../supabaseClient');

class Category {
  constructor({
    category_id,
    name,
    description = null,
    parent_category_id = null
  }) {
    this.category_id = category_id;
    this.name = name;
    this.description = description;
    this.parent_category_id = parent_category_id;
  }

  static async create(categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();
    if (error) throw error;
    return new Category(data);
  }

  static async findById(category_id) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('category_id', category_id)
      .single();
    if (error) throw error;
    return data ? new Category(data) : null;
  }

  static async findAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*');
    if (error) throw error;
    return data.map(row => new Category(row));
  }

  static async update(category_id, updates) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('category_id', category_id)
      .select()
      .single();
    if (error) throw error;
    return new Category(data);
  }

  static async delete(category_id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('category_id', category_id);
    if (error) throw error;
    return true;
  }
}

module.exports = Category;
