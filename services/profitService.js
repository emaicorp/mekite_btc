const User = require('../models/User');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const InvestmentPlan = require('../models/InvestmentPlan');

class ProfitService {
  static async calculateAndDistributeDailyProfits() {
    try {
      console.log('\n=== Starting Daily Profit Distribution ===\n');
      
      // Get all users
      const users = await User.find({}).select('_id username totalEarnings walletAddress');
      console.log(`Found ${users.length} total users`);

      const profitResults = {
        successful: 0,
        failed: 0,
        totalProfitDistributed: 0,
        usersProcessed: 0
      };

      for (const user of users) {
        console.log(`\n--- Processing User: ${user.username} (${user._id}) ---`);
        console.log(`Current total earnings: $${user.totalEarnings || 0}`);
        
        try {
          // Get user's approved investments
          const investments = await Investment.find({
            userId: user._id,
            status: 'approved',
            expiresAt: { $gt: new Date() },
            
          });

          console.log(`Found ${investments.length} approved investments for user`);

          if (investments.length === 0) {
            console.log('No active investments to process, skipping user');
            continue;
          }

          let userDailyProfit = 0;

          for (const investment of investments) {
            console.log(`\nProcessing Investment: ${investment._id}`);
            console.log(`Package: ${investment.selectedPackage}`);
            console.log(`Amount: $${investment.amount}`);
            console.log(`Current Profit: $${investment.profit}`);

            // Get investment plan details
            const plan = await InvestmentPlan.findOne({ 
              name: investment.selectedPackage
            });
            
            if (!plan) {
                console.log(plan)
              console.error(`❌ Plan not found for investment ${investment._id}`);
              continue;
            }

            console.log(`Found plan: ${plan.name} (${plan.dailyProfit}% daily)`);

            // Calculate daily profit
            const dailyProfit = (investment.amount * plan.dailyProfit) / 100;
            console.log(`Calculated daily profit: $${dailyProfit}`);
            
            // Update investment profit
            const oldProfit = investment.profit;
            investment.profit += dailyProfit;
            investment.isProfitAdded = true;
            investment.lastProfitUpdate = new Date();
            
            console.log(`Updated investment profit: $${oldProfit} -> $${investment.profit}`);
            
            await investment.save();
            console.log(`✅ Saved investment update`);

            userDailyProfit += dailyProfit;

            // Create profit transaction
            const transaction = await Transaction.create({
              userId: user._id,
              type: 'profit',
              amount: dailyProfit,
              status: 'completed',
              currency: investment.paymentMethod,
              description: `Daily profit from ${investment.selectedPackage} investment`,
              walletAddress: user.walletAddress
            });

            console.log(`✅ Created profit transaction: ${transaction._id}`);

            profitResults.successful++;
            profitResults.totalProfitDistributed += dailyProfit;
          }

          // Update user's total earnings
          const oldEarnings = user.totalEarnings || 0;
          user.totalEarnings = oldEarnings + userDailyProfit;
          await user.save();
          
          console.log(`Updated user total earnings: $${oldEarnings} -> $${user.totalEarnings}`);
          console.log(`✅ Saved user data`);

          profitResults.usersProcessed++;
        } catch (error) {
          console.error(`❌ Error processing profits for user ${user._id}:`, error);
          profitResults.failed++;
        }
      }

      console.log('\n=== Daily Profit Distribution Summary ===');
      console.log(`✅ Users processed: ${profitResults.usersProcessed}`);
      console.log(`✅ Successful distributions: ${profitResults.successful}`);
      console.log(`❌ Failed distributions: ${profitResults.failed}`);
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