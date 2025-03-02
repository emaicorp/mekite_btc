const User = require('../models/User');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const InvestmentPlan = require('../models/InvestmentPlan');

class ProfitService {
  static async calculateAndDistributeDailyProfits() {
    try {
      console.log('\n=== Starting Daily Profit Distribution ===\n');
      
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
      console.log(`Processing for date: ${currentDate.toDateString()}`);

      const users = await User.find({}).select('_id username totalEarnings walletAddress availableBalance activeDeposit');
      console.log(`Found ${users.length} total users`);

      const profitResults = {
        successful: 0,
        failed: 0,
        totalProfitDistributed: 0,
        usersProcessed: 0,
        expiredInvestments: 0
      };

      for (const user of users) {
        console.log(`\n--- Processing User: ${user.username} (${user._id}) ---`);
        
        try {
          // Find investments expiring within next 24 hours
          const expiredInvestments = await Investment.find({
            userId: user._id,
            status: 'approved',
            expiresAt: {
              $lte: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
            }
          });

          console.log(`Found ${expiredInvestments.length} investments expiring within 24 hours`);

          // Process expiring investments
          for (const investment of expiredInvestments) {
            console.log(`\nProcessing Investment: ${investment._id}`);
            console.log(`Amount: $${investment.amount}, Current Profit: $${investment.profit}`);

            // Calculate final daily profit
            const plan = await InvestmentPlan.findOne({ name: investment.selectedPackage });
            if (plan) {
              const finalDailyProfit = (investment.amount * plan.dailyProfit) / 100;
              investment.profit += finalDailyProfit;
              console.log(`Added final daily profit: $${finalDailyProfit}`);
              
              // Add daily profit to total earnings
              user.totalEarnings = (user.totalEarnings || 0) + finalDailyProfit;
              console.log(`Updated total earnings with final profit: $${finalDailyProfit}`);
            }

            // Add investment amount and total profit to available balance
            console.log(`Available balance before: $${user.availableBalance}`);
            user.availableBalance = (user.availableBalance || 0) + investment.amount + investment.profit;
            console.log(`Available balance after: $${user.availableBalance}`);

            // Deduct investment amount and profit from active deposit
            user.activeDeposit = (user.activeDeposit || 0) - (investment.amount + investment.profit);
            console.log(`Updated active deposit: $${user.activeDeposit}`);

            // Create completion transaction
            await Transaction.create({
              userId: user._id,
              type: 'investment_completed',
              amount: investment.amount + investment.profit,
              status: 'completed',
              currency: investment.paymentMethod,
              description: `Investment completed: ${investment.selectedPackage} - Principal: $${investment.amount}, Total Profit: $${investment.profit}`,
              walletAddress: user.walletAddress
            });

            // Delete the investment
            await Investment.findByIdAndDelete(investment._id);
            console.log(`✅ Completed and deleted investment: ${investment._id}`);

            profitResults.expiredInvestments++;
          }

          // Save user changes if any expired investments were processed
          if (expiredInvestments.length > 0) {
            await user.save();
            console.log(`✅ Updated user balances after processing expired investments`);
          }

          // Process active investments (not expiring within 24 hours)
          const activeInvestments = await Investment.find({
            userId: user._id,
            status: 'approved',
            expiresAt: {
              $gt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
            }
          });

          console.log(`Found ${activeInvestments.length} active investments`);

          // Process active investments
          for (const investment of activeInvestments) {
            const plan = await InvestmentPlan.findOne({ name: investment.selectedPackage });
            if (!plan) continue;

            const dailyProfit = (investment.amount * plan.dailyProfit) / 100;
            console.log(`Calculated daily profit: $${dailyProfit}`);

            // Update investment profit
            investment.profit += dailyProfit;
            investment.isProfitAdded = true;
            investment.lastProfitUpdate = new Date();
            await investment.save();

            // Add daily profit to both total earnings and active deposit
            user.totalEarnings = (user.totalEarnings || 0) + dailyProfit;
            user.activeDeposit = (user.activeDeposit || 0) + dailyProfit;
            
            console.log(`Added daily profit to total earnings and active deposit: $${dailyProfit}`);

            // Create profit transaction
            await Transaction.create({
              userId: user._id,
              type: 'profit',
              amount: dailyProfit,
              status: 'completed',
              currency: investment.paymentMethod,
              description: `Daily profit from ${investment.selectedPackage} investment`,
              walletAddress: user.walletAddress
            });

            profitResults.successful++;
            profitResults.totalProfitDistributed += dailyProfit;
          }

          // Save final user updates
          if (activeInvestments.length > 0) {
            await user.save();
            console.log(`✅ Updated user data for active investments`);
          }

          profitResults.usersProcessed++;
        } catch (error) {
          console.error(`❌ Error processing user ${user._id}:`, error);
          profitResults.failed++;
        }
      }

      console.log('\n=== Daily Profit Distribution Summary ===');
      console.log(`✅ Users processed: ${profitResults.usersProcessed}`);
      console.log(`✅ Successful distributions: ${profitResults.successful}`);
      console.log(`❌ Failed distributions: ${profitResults.failed}`);
      console.log(`📅 Expired investments processed: ${profitResults.expiredInvestments}`);
      console.log(`💰 Total profit distributed: $${profitResults.totalProfitDistributed}`);
      console.log('\n=== End of Daily Profit Distribution ===\n');

      return profitResults;
    } catch (error) {
      console.error('❌ Fatal error in profit distribution:', error);
      throw new Error(`Error calculating daily profits: ${error.message}`);
    }
  }

  static async getProfitStatistics() {
    try {
      console.log('\n=== Getting Profit Statistics ===');
      const stats = await Transaction.aggregate([
        {
          $match: {
            type: 'profit',
            status: 'completed'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            totalProfit: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: -1 }
        }
      ]);

      console.log(`Found statistics for ${stats.length} days`);
      stats.forEach(stat => {
        console.log(`${stat._id}: $${stat.totalProfit} (${stat.count} transactions)`);
      });
      console.log('=== End of Statistics ===\n');

      return stats;
    } catch (error) {
      console.error('❌ Error getting statistics:', error);
      throw new Error(`Error getting profit statistics: ${error.message}`);
    }
  }
}

module.exports = ProfitService; 