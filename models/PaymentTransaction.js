const supabase = require('../supabaseClient');

class PaymentTransaction {
  constructor({
    transaction_id,
    order_id,
    payment_gateway,
    gateway_transaction_id,
    amount,
    currency,
    status,
    transaction_date,
    payment_method = null,
    failure_reason = null
  }) {
    this.transaction_id = transaction_id;
    this.order_id = order_id;
    this.payment_gateway = payment_gateway;
    this.gateway_transaction_id = gateway_transaction_id;
    this.amount = amount;
    this.currency = currency;
    this.status = status;
    this.transaction_date = transaction_date;
    this.payment_method = payment_method;
    this.failure_reason = failure_reason;
  }

  static async create(transactionData) {
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert([transactionData])
      .select()
      .single();
    if (error) throw error;
    return new PaymentTransaction(data);
  }

  static async findById(transaction_id) {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', transaction_id)
      .single();
    if (error) throw error;
    return data ? new PaymentTransaction(data) : null;
  }

  static async findByOrderId(order_id) {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', order_id)
      .single();
    if (error) throw error;
    return data ? new PaymentTransaction(data) : null;
  }

  static async update(transaction_id, updates) {
    const { data, error } = await supabase
      .from('payment_transactions')
      .update(updates)
      .eq('transaction_id', transaction_id)
      .select()
      .single();
    if (error) throw error;
    return new PaymentTransaction(data);
  }

  static async delete(transaction_id) {
    const { error } = await supabase
      .from('payment_transactions')
      .delete()
      .eq('transaction_id', transaction_id);
    if (error) throw error;
    return true;
  }
}

module.exports = PaymentTransaction;
