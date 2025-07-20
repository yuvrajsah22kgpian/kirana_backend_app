const supabase = require('../supabaseClient');

class SupportTicket {
  constructor({
    ticket_id,
    user_id,
    subject,
    description,
    status,
    priority,
    assigned_to_admin_id = null,
    created_at,
    updated_at,
    closed_at = null
  }) {
    this.ticket_id = ticket_id;
    this.user_id = user_id;
    this.subject = subject;
    this.description = description;
    this.status = status;
    this.priority = priority;
    this.assigned_to_admin_id = assigned_to_admin_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.closed_at = closed_at;
  }

  static async create(ticketData) {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert([ticketData])
      .select()
      .single();
    if (error) throw error;
    return new SupportTicket(data);
  }

  static async findById(ticket_id) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('ticket_id', ticket_id)
      .single();
    if (error) throw error;
    return data ? new SupportTicket(data) : null;
  }

  static async findAllByUserId(user_id) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user_id);
    if (error) throw error;
    return data.map(row => new SupportTicket(row));
  }

  static async update(ticket_id, updates) {
    const { data, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('ticket_id', ticket_id)
      .select()
      .single();
    if (error) throw error;
    return new SupportTicket(data);
  }

  static async delete(ticket_id) {
    const { error } = await supabase
      .from('support_tickets')
      .delete()
      .eq('ticket_id', ticket_id);
    if (error) throw error;
    return true;
  }
}

module.exports = SupportTicket; 