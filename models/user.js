const supabase = require('../supabaseClient');

class User {
  constructor({
    user_id,
    first_name,
    last_name,
    email,
    password_hash,
    phone_number,
    address_line1,
    address_line2 = null,
    city,
    state,
    zip_code,
    country,
    profile_picture_url = null,
    terms_accepted_at,
    marketing_opt_in = false,
    created_at,
    updated_at
  }) {
    this.user_id = user_id;
    this.first_name = first_name;
    this.last_name = last_name;
    this.email = email;
    this.password_hash = password_hash;
    this.phone_number = phone_number;
    this.address_line1 = address_line1;
    this.address_line2 = address_line2;
    this.city = city;
    this.state = state;
    this.zip_code = zip_code;
    this.country = country;
    this.profile_picture_url = profile_picture_url;
    this.terms_accepted_at = terms_accepted_at;
    this.marketing_opt_in = marketing_opt_in;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static async create(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    if (error) throw error;
    return new User(data);
  }

  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error) throw error;
    return data ? new User(data) : null;
  }

  static async findById(user_id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user_id)
      .single();
    if (error) throw error;
    return data ? new User(data) : null;
  }

  static async update(user_id, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', user_id)
      .select()
      .single();
    if (error) throw error;
    return new User(data);
  }

  static async delete(user_id) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', user_id);
    if (error) throw error;
    return true;
  }
}

module.exports = User;
