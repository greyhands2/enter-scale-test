
const express = require('express');

const { fetchAllStaffs, createStaff, fetchStaff, editStaff,  updateMe, deleteMe, setMe, resendValidationEmail, fetchStaffSetPopulation} = require('../controllers/staffsControllers.js');

const  { register, login, forgotPassword, updatePassword, shield, restrictTo, verifyOTPClosure, logout } = require('../../controllers/auth/authController.js');

const router = express.Router();


 


//auth
router.post('/register', register);
router.post('/resendValidationEmail', resendValidationEmail);
router.post('/login', login);

router.post('/verifyEmail', verifyOTPClosure('emailVerify'));
//router.get('/logout', logout);

router.post('/forgotPassword', forgotPassword);

router.patch('/resetPassword', verifyOTPClosure('resetPassword'));

router.patch('/unDeleteMe', resendValidationEmail);
//as u can imagine url would be /Staffs/register
router.use(shield);

router.patch('/updateMyPassword', updatePassword);

router.get('/me', setMe,fetchStaffSetPopulation, fetchStaff);

router.patch('/updateMe', updateMe);



router.delete('/deleteMe', deleteMe);



router.post('/logout', logout);



// Staffs
//mount the StaffRouter
//restful routes
// /Staffs

router.use(restrictTo('admin'));


// these endpoints should only be accesed by special Staffs
router.route('/')
.get(fetchAllStaffs)
.post(createStaff);

// /Staff/id
router.route('/:id')
.get(fetchStaff)
.patch(editStaff);
// .delete(deleteStaff);









module.exports = router;