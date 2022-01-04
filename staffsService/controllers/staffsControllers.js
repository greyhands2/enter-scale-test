

const factory = require('../../utils/factoryHandlers.js');
const Staff = require('../../models/Staffs/StaffsModel.js');

const setMe = require('../../utils/setMe.js');
const catchAsync = require('../../utils/catchControllerAsyncs.js');

const AppError = require('../../errorService/AppErrorModule.js');
const emailComposer = require('../../utils/emailComposer.js');

// middleware for setMe
exports.setMe = setMe;




exports.fetchAllStaffs = factory.getAll(Staff);



exports.createStaff = (req, res) => {

	res.status(500)
	.json({
		status: "error",
		message:"Please Use the Sign Up Page"
	});

	
}

exports.fetchStaff = factory.getOne(Staff);


exports.fetchStaffSetPopulation =  (req, res, next) => {
	
	if(req.Staff.role === 'Staff') req.body.populate=[ {path: 'clockIns', select: 'verifyStatus link name'}];
		
	
	
	next();
}
//for a logged Staff to update Staff data

exports.updateMe = catchAsync( async (req,res, next) => {
	// 1.) Create error if Staff tries to update password
	if(req.body.password || req.body.passwordConfirm){
		return next(new AppError('This Link is not for Password Update, Please Use Update My Password Link', 400))
	}




	// 2.) filter out unwanted fields that are not allowed to be updated
	
	let {lastName, firstName, email, phone, dob} = req.body;
	let replyMessage;
	// finally update Staff
	let updatedStaff;
	//ensure that if there is an email update , it isnt redundant and give room to update other staff data
	if(req.Staff.email !== email	||	!!lastName	||	!!firstName	||	!!phone	||	!!dob){

		 updatedStaff = await Staff.findById(req.Staff.id );
		 updatedStaff.email = email	??	updatedStaff.email;
		updatedStaff.firstName = firstName ?? updatedStaff.firstName;
		updatedStaff.lastName = lastName ?? updatedStaff.lastName;
		updatedStaff.phone = phone ?? updatedStaff.phone;
		updatedStaff.dob = dob ?? updatedStaff.dob
		
		 updatedStaff=await updatedStaff.save({new: true, runValidators:true});
		 replyMessage="Staff Data Updated Sucessfully";
	} else {
		return next(new AppError('Wrong Input', 400));
	}
	
	if(!updatedStaff) return next(new AppError('Oopss!!! Something Went Wrong Try Again', 400));

	if ((!!email === true && req.Staff.email !== email) ){
		
		// oya create OTP
		updatedStaff.active = "unverified";
	const OTP = updatedStaff.createOTP();
		

	updatedStaff=await updatedStaff.save({validateBeforeSave: false});
	//send OTP to Staff email
	const message = `You know how it goes 🤓, your OTP is: ${OTP}, input that on the verify email page and you're all set 🤝`;

	emailComposer(updatedStaff, message,  "Would You Be So Kind as to Confirm Your Updated Email", 'verifyEmail');
		replyMessage = "Staff Data Updated Sucessfully and Email Sent to you for Reverification";
	}
	
	
	return res.status(200).json({
		status: "success",
		message:  replyMessage,
		//if the user sent redundant data or didnt end up updating anything then send no data else send updated data
		StaffData: ( !!lastName || !!firstName	||	!!dob	||	!!phone)	?	updatedStaff	:	undefined
	});
	



});



exports.deleteMe = catchAsync( async (req, res, next) => {
	
	//  await Staff.findByIdAndUpdate(req.Staff.id, {active: false});
	const delStaff = await Staff.findById(req.Staff.id);
	if(!delStaff) return next(new AppError('Oopss!!! Something Went Wrong Try Again', 400));
	delStaff.active = "deleted";
	delStaff.save({validateBeforeSave: false});
	
	res.status(204).json({
		status: 'success',
		data: null
	});



});



exports.resendValidationEmail = catchAsync( async (req, res, next) => {

	const {email} = req.body;
	if(!email) return res.status(400).json({
		status: "Unsuccessful",
		message:"Input an Email"
	});
	const Staff = await Staff.findOne({email});
	if(!Staff) return next(new AppError("There is No Record of This Email", 404));
	if(Staff.active === 'suspended' || Staff.active === 'takenDown') return next(new AppError("Your Account is Currently Not Allowed to Perform this Action", 500));
	
	// oya create OTP
	const OTP = Staff.createOTP();


	await Staff.save({validateBeforeSave: false});
//send OTP to Staff email
const message = `Welcome back, you know how it goes 🤓, your OTP is: ${OTP}, input that on the verify email page and you're all set Once Again 🤝`;

 emailComposer(Staff, message, "Would You Be So Kind as to Confirm Your Email Again", 'verifyEmail');


 return res.status(200)
 .json({
	 status: "success",
	 message: "OTP Has Been Sent to You"
 });
});



/******               *******/
// for admin , do not update password with this
exports.editStaff =  catchAsync( async (req, res, next) => {
	
	let editedStaff;
	
	const {active} = filterObj(req.body, "active");
	
	if(!active || ["suspended", "takenDown", "unverified"].indexOf(active) === -1) return res.status(400).json({status: "failed",
message: "Wrong Input"
});



	editedStaff = await Staff.findById(req.params.id).select('-passwordChangedAt -__v');

	if(!editedStaff) return next(new AppError("Staff Does Not Exist", 404));
	editedStaff.active=active;

	
	await editedStaff.save({new: true, runValidators:true});
	
	res.status(200).json({
		status: "success",
		message: "Staff Data Updated",
		data: {
			editedStaff
		}
	});


	
});



exports.deleteStaff = factory.deleteOne(Staff);



/*************                  ******/

