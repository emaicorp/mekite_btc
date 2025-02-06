const axios = require('axios');
const NodeCache = require('node-cache');

// Initialize cache with 30 seconds TTL
const cache = new NodeCache({ stdTTL: 30 });

class CryptoController {
  static async getChartData(req, res) {
    try {
      const { coinId = 'bitcoin', currency = 'usd', days = '1' } = req.query;
      const cacheKey = `chart_${coinId}_${currency}_${days}`;

      // Check cache first
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(cachedData);
      }

      // If not in cache, fetch from API
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
        {
          params: {
            vs_currency: currency,
            days: days,
            interval: days === '1' ? 'hourly' : 'daily'
          },
          headers: {
            'Accept': 'application/json',
            // Add your API key if you have one
            // 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY
          }
        }
      );

      // Store in cache
      cache.set(cacheKey, response.data);

      res.status(200).json(response.data);
    } catch (error) {
      // Handle rate limit error specifically
      if (error.response && error.response.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 60;
        return res.status(429).json({
          success: false,
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds`,
          retryAfter
        });
      }

      console.error('Crypto chart error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching chart data',
        error: error.message
      });
    }
  }

  static async getCurrentPrice(req, res) {
    try {
      const { coinId } = req.params;
      const { currency = 'usd' } = req.query;

      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price`,
        {
          params: {
            ids: coinId,
            vs_currencies: currency
          }
        }
      );

      res.status(200).json({
        success: true,
        data: response.data
      });
    } catch (error) {
      console.error('Current price error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching current price',
        error: error.message
      });
    }
  }

  static async getMarketData(req, res) {
    try {
      const { currency = 'usd', per_page = 100, page = 1 } = req.query;

      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets',
        {
          params: {
            vs_currency: currency,
            order: 'market_cap_desc',
            per_page,
            page,
            sparkline: false
          }
        }
      );

      res.status(200).json({
        success: true,
        data: response.data
      });
    } catch (error) {
      console.error('Market data error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching market data',
        error: error.message
      });
    }
  }
}

module.exports = CryptoController; 