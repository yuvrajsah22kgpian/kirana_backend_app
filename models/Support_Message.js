const supabase = require('../supabaseClient');

class SupportMessage {
  constructor({
    message_id,
    ticket_id,
    sender_id,
    sender_type,
    message_text,
    sent_at
  }) {
    this.message_id = message_id;
    this.ticket_id = ticket_id;
    this.sender_id = sender_id;
    this.sender_type = sender_type;
    this.message_text = message_text;
    this.sent_at = sent_at;
  }

  static async create(messageData) {
    const { data, error } = await supabase
      .from('support_messages')
      .insert([messageData])
      .select()
      .single();
    if (error) throw error;
    return new SupportMessage(data);
  }

  static async findById(message_id) {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('message_id', message_id)
      .single();
    if (error) throw error;
    return data ? new SupportMessage(data) : null;
  }

  static async findAllByTicketId(ticket_id) {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticket_id);
    if (error) throw error;
    return data.map(row => new SupportMessage(row));
  }

  static async update(message_id, updates) {
    const { data, error } = await supabase
      .from('support_messages')
      .update(updates)
      .eq('message_id', message_id)
      .select()
      .single();
    if (error) throw error;
    return new SupportMessage(data);
  }

  static async delete(message_id) {
    const { error } = await supabase
      .from('support_messages')
      .delete()
      .eq('message_id', message_id);
    if (error) throw error;
    return true;
  }
}

module.exports = SupportMessage; 