const cron = require('node-cron');
const User = require('../models/User'); // Adjust path as needed

// Cron job that runs every day at midnight (or adjust the schedule as needed)
cron.schedule('0 0 * * *', async () => {
  try {
    // Find investments where profit has not been added yet and the expiration date has passed
    const users = await User.find({
      'investments.isProfitAdded': false,
      'investments.expiresAt': { $lt: new Date() } // Check if expiration date has passed
    });

    users.forEach(async (user) => {
      user.investments.forEach(async (investment) => {
        if (!investment.isProfitAdded && new Date(investment.expiresAt) < new Date()) {
          const plans = {
            'Starter Plan': { dailyProfit: 6, duration: 3 },
            'Premium Plan': { dailyProfit: 10, duration: 5 },
            'Professional Plan': { dailyProfit: 15, duration: 6 },
          };

          const plan = plans[investment.selectedPackage];
          if (plan) {
            // Calculate total profit
            const totalProfit = plan.dailyProfit * plan.duration;

            // Update user’s balance and investment status
            user.availableBalance += totalProfit + investment.amount;
            user.totalEarnings += totalProfit;
            user.activeDeposit -= investment.amount;
            investment.status = 'completed'; // Mark investment as completed
            investment.isProfitAdded = true; // Mark profit as added

            await user.save(); // Save updated user data
          }
        }
      });
    });
  } catch (error) {
    console.error('Error updating investments:', error);
  }
});
