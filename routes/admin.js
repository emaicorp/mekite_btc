// routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/UserModels');

// View all transactions with filtering options
router.get('/transactions', async (req, res) => {
  try {
    const { type, status } = req.query;

    const filter = {};
    if (type) filter['history.type'] = type;
    if (status) filter['history.status'] = status;

    const transactions = await User.aggregate([
      { $unwind: '$history' }, 
      { $match: filter },
      { $project: { 'history': 1 } }
    ]);

    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching transactions', error: err });
  }
});

// Approve or Reject withdrawal request
router.put('/withdrawals/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findOneAndUpdate(
      { 'withdrawals._id': id },
      { $set: { 'withdrawals.$.status': status } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    res.status(200).json({ message: 'Withdrawal request updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating withdrawal status', error: err });
  }
});

// Update Investment Plan Information
router.put('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, minimumAmount, maximumAmount, duration } = req.body;

    if (!title || !description || !minimumAmount || !maximumAmount || !duration) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOneAndUpdate(
      { 'plans._id': id },
      {
        $set: {
          'plans.$.title': title,
          'plans.$.description': description,
          'plans.$.minimumAmount': minimumAmount,
          'plans.$.maximumAmount': maximumAmount,
          'plans.$.duration': duration,
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    res.status(200).json({ message: 'Plan updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating plan information', error: err });
  }
});

// Endpoint to fetch platform statistics
router.get('/statistics', async (req, res) => {
    try {
      // Total Users
      const totalUsers = await User.countDocuments();
  
      // Active Users
      const activeUsers = await User.countDocuments({ isActive: true });
  
      // Total Deposits (Sum of all deposits in history)
      const totalDeposits = await User.aggregate([
        { $unwind: "$history" },
        { $match: { "history.type": "deposit" } },
        { $group: { _id: null, totalDeposits: { $sum: "$history.amount" } } }
      ]);
      
      // Total Withdrawals (Sum of all withdrawals)
      const totalWithdrawals = await User.aggregate([
        { $unwind: "$withdrawals" },
        { $group: { _id: null, totalWithdrawals: { $sum: "$withdrawals.amount" } } }
      ]);
  
      // Total Revenue (Sum of all earnings)
      const totalRevenue = await User.aggregate([
        { $unwind: "$history" },
        { $match: { "history.type": "earning" } },
        { $group: { _id: null, totalRevenue: { $sum: "$history.amount" } } }
      ]);
  
      // Prepare response
      res.json({
        totalUsers,
        activeUsers,
        totalDeposits: totalDeposits[0]?.totalDeposits || 0,
        totalWithdrawals: totalWithdrawals[0]?.totalWithdrawals || 0,
        totalRevenue: totalRevenue[0]?.totalRevenue || 0
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  });

  // Endpoint to generate reports
// Endpoint to fetch reports
router.get("/reports", async (req, res) => {
    const { type } = req.query;  // "daily", "monthly", or "yearly"
    
    try {
      const today = new Date();
      let startDate, endDate;
  
      // Set the start and end date based on the report type
      if (type === "daily") {
        startDate = new Date(today.setHours(0, 0, 0, 0)); // start of today
        endDate = new Date(today.setHours(23, 59, 59, 999)); // end of today
      } else if (type === "monthly") {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1); // first day of this month
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999); // last day of this month
      } else if (type === "yearly") {
        startDate = new Date(today.getFullYear(), 0, 1); // start of this year
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999); // end of this year
      } else {
        return res.status(400).json({ message: "Invalid report type" });
      }
  
      // Query to get user transactions within the date range
      const users = await User.aggregate([
        {
          $unwind: "$history" // Deconstruct transaction history array
        },
        {
          $match: {
            "history.date": {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalDeposits: {
              $sum: {
                $cond: [{ $eq: ["$history.type", "deposit"] }, "$history.amount", 0],
              },
            },
            totalWithdrawals: {
              $sum: {
                $cond: [{ $eq: ["$history.type", "withdrawal"] }, "$history.amount", 0],
              },
            },
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ["$history.type", "earning"] }, "$history.amount", 0],
              },
            },
          },
        },
      ]);
  
      const report = users[0] || {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalRevenue: 0,
      };
  
      // Send the report data
      res.status(200).json({
        totalUsers: await User.countDocuments(),
        activeUsers: await User.countDocuments({ isActive: true }),
        totalDeposits: report.totalDeposits,
        totalWithdrawals: report.totalWithdrawals,
        totalRevenue: report.totalRevenue,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });

module.exports = router;
