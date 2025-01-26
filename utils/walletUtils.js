const crypto = require('crypto');

function generateWalletAddress() {
  // This is a simplified example. In production, use proper wallet generation
  return crypto.randomBytes(32).toString('hex');
}

function generateReferralLink(username) {
  // Generate a referral link based on username
  return `${process.env.FRONTEND_URL}/ref/${username}`;
}

module.exports = {
  generateWalletAddress,
  generateReferralLink
}; 