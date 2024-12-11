const express = require('express');
const {
    getAllUsers,
    getUserById,
    deleteUser
} = require('../controller/adminController');  // Corrected import to include all required functions

const router = express.Router();

// Get all users
router.get('/users', getAllUsers);

// Get user by ID
router.get('/users/:id', getUserById);

// Delete user
router.delete('/users/:id', deleteUser);

module.exports = router;
