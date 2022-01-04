
const express = require('express');


const {getAllStaffsClockin, getStaffClockin, addClockIn} =require('../controllers/clockInController.js');

const  {shield, restrictTo } = require('../../authService/authController.js')
const router = express.Router();

router.use(shield)
router.use(restrictTo("admin"))

router.post('addClockIn/:staffId', addClockIn);

router.get("getStaffClockin/:staffId", getStaffClockin)

router.get("getAllStaffsClockin", getAllStaffsClockin)
 
module.exports = router;