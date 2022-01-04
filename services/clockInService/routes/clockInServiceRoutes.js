
const express = require('express');


const {getAllStaffsClockin, getStaffClockin, addClockIn} =require('../controllers/clockInController.js');

const  {shield, restrictTo } = require('../../authService/authController.js')
const router = express.Router();

router.use(shield)


router.post('/addClockIn', addClockIn);
router.get("/getMyClockIns", getStaffClockin("staff"));
router.use(restrictTo("admin"));
router.get("/getStaffClockin/:staffId", getStaffClockin("admin"))



router.get("/getAllStaffsClockin", getAllStaffsClockin)
 
module.exports = router;