var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PortfolioSchema = new Schema({
 user_id     : String,
 cash_balance: Number,
 stocks: [
  {shares: Number,
  date_of_purchase: String,
  price_at_purchase: Number,
  follower_count_at_purchase: Number,
  current_follower_count: Number,
  current_price: Number,
  name: String,
  screen_name: String,
	sentiment: Number}]
});

var Portfolio = mongoose.model('Portfolio', PortfolioSchema);

module.exports = Portfolio;
