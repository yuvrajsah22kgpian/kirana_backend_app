const supabase = require('../supabaseClient');

class AdminUser {
  constructor({
    admin_user_id,
    username,
    password_hash,
    email,
    first_name,
    last_name,
    role,
    last_login_at = null,
    created_at,
    updated_at
  }) {
    this.admin_user_id = admin_user_id;
    this.username = username;
    this.password_hash = password_hash;
    this.email = email;
    this.first_name = first_name;
    this.last_name = last_name;
    this.role = role;
    this.last_login_at = last_login_at;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static async create(adminData) {
    const { data, error } = await supabase
      .from('admin_users')
      .insert([adminData])
      .select()
      .single();
    if (error) throw error;
    return new AdminUser(data);
  }

  static async findById(admin_user_id) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('admin_user_id', admin_user_id)
      .single();
    if (error) throw error;
    return data ? new AdminUser(data) : null;
  }

  static async findByUsername(username) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single();
    if (error) throw error;
    return data ? new AdminUser(data) : null;
  }

  static async update(admin_user_id, updates) {
    const { data, error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('admin_user_id', admin_user_id)
      .select()
      .single();
    if (error) throw error;
    return new AdminUser(data);
  }

  static async delete(admin_user_id) {
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('admin_user_id', admin_user_id);
    if (error) throw error;
    return true;
  }
}

module.exports = AdminUser; 