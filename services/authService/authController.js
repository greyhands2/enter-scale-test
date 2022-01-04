

const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const Staff = require('../staffsService/models/staffsModel.js');

const catchAsync = require('../../utils/catchControllerAsyncs.js');

const AppError = require('../errorService/AppErrorModule.js');




const {createAndSendToken} = require('./jwtThingies.js');

const emailComposer = require('../../utils/emailComposer.js');







exports.register = catchAsync( async (req, res, next) => {
	const {password, passwordConfirm, email, porkipsee} = req.body; 
	// porkipsee is used to be affirmative the new Staff being created is an admin.. and the porkipsee field has to be passed as "true" else a normal Staff
	let role, active;
	if(porkipsee === "true"){
		role="admin",
		active="verified";
	}  else {
		role="staff",
		active="unverified";
	}
	
	const newStaff = await Staff.create({
		
		email,
		
		password, 
		passwordConfirm,
		role,
		active
	});

	

	if(porkipsee === "true") return res.status(200).json({
		status: "Done",
		message: "That Admin Has Been Created"
	});

// oya create OTP
const OTP = newStaff.createOTP();
console.log(OTP)

await newStaff.save({validateBeforeSave: false});
//send OTP to Staff email
const message = `You know how it goes 🤓, your OTP is: ${OTP}, input that on the verify email page and you're all set 🤝`;

 emailComposer(newStaff, message, "Would You Be So Kind as to Confirm Your Email",'welcome');

 return res.status(201)
 .json({
	 status: "success",
	 message: "OTP Has Been Sent to You"
 });

});

 

exports.logout = catchAsync(async(req, res, next)=>{
	if(!req.body.token) return res.status(200).json({
		status: "failure",
		message:"Invalid Token"
	});

	await Staff.findOne({stoken: req.body.token, _id: req.staff.id}).then((data)=>{
		data.stoken=undefined;
		data.save();
		return res.status(200).json({
			status: "success",
			message: "Log out Successful"
		})
	}).catch((e)=>{
		return res.status(200).json({
			status: "failure",
			message:"Oopss!!! Something is not right"
		});
	})
})
 


exports.login = catchAsync( async (req, res, next) => {
	
	const {email, password} = req.body;

	// step 1: chek if email and password exists from the req object

	if(!(!!email) || !(!!password)) return next(new AppError('Please Provide Valid Email and Password', 400));

	// step 2: check if Staff exists in db and if password is correct
	//since we already set our Staff schema to never return a password i.e select:false, we need to explicitly select it here by adding + to the field name

	const staff = await Staff.findOne({email}).select('+password -__v');
	// here we access the instance method we set to the StaffSchema to check if the password is correct
	
		if(!staff || !(await staff.validatePassword(password, staff.password))){
		return next(new AppError('Incorrect Email or Password', 401));
	}
	
	let optionalMessage=staff.active;
	
	// 3.) if everything is ok send token to client
	let {token, nuRes} =  createAndSendToken(staff, res );
	
	 staff.stoken = token;
	let newStaff  = await staff.save({validateBeforeSave: false});


	doTheNeedfulForLogin ({optionalMessage, statusCode: 200, token, newStaff, nuRes});
	

});

const doTheNeedfulForLogin = ({optionalMessage, statusCode, token, newStaff, nuRes}) => {
	newStaff.password=undefined;
	newStaff.__v = undefined;
	
	
	if(optionalMessage === 'verified'){
		return nuRes.status(statusCode).json({
		status: 'success',
		token: token,
		data:{
			staff: newStaff
		} 
	});

	} else if(optionalMessage === 'unverified') {
		return nuRes.status(401).json({
			status: 'failed',
			
			message: "Please Verify Your Email Address"
		});

	} else if(optionalMessage === 'suspended') {
		return nuRes.status(401).json({
			status: 'failed',
			
			message: "This Account Has Been Suspended, You Will Be Sent An Email If Reinstated"
		});

	} else if(optionalMessage === 'deleted') {
		return nuRes.status(404).json({
			status: 'failed',
			
			message: "This Staff Was Deleted By You, Use The ReActivate Button to Get it Back"
		});

	}

 }


 //this controller shields every route by ensuring the user is a logged in user
exports.shield = catchAsync(async(req, res, next)=> {

	// 1.) getting token or check if it's there
	let token;
	if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
		token = req.headers.authorization.split(' ')[1];
	}

	if(!token || token ===''){
		// status code 401 means unauthorized
		return next(new AppError('Please Login to Get Access', 401));
	}
	
	// 2.) verify the token
	
	const decoded = await promisify(jwt.verify)(token, process.env.JWTITTIES_SEACRIIT);
	
	// 3.) check if Staff still exists if token was verified
	const freshStaff = await Staff.findById(decoded.id);
	if(!freshStaff || freshStaff.active !== "verified"){
		return next(new AppError('This Staff no Longer Exists', 401));
	}
	if(freshStaff.stoken !== token) return next(new AppError('Token Expired Please Log In', 401));

	// 4.) check if Staff changed password after the token was issued
	if(freshStaff.afterChangeOfPassword(decoded.iat)){
		return next(new AppError('Staff recently changed Password, Log in Again', 401));
	}

//since the Staff has access rights the Staff obj can be useful for determining which data to show to the Staff in the future, we then attach this Staff to the req object
req.staff = freshStaff;
// so then grant access to the protected route
	next();
});




exports.restrictTo = (...roles) => {
	// returning the middleware inside
	return (req, res, next) => {
		// note the req.Staff.role here is gotten after the protect middleware has been run
		
		if(roles.indexOf(req.staff.role) === -1){
			
			return next(new AppError('You Do Not Have Permission to Perform This Action', 403));
		}
		
		
		next();
	}
}



exports.forgotPassword = catchAsync(async(req, res, next) => {

	if(!(!!req.body.email)) return next(new AppError('Please Provide a valid email', 404));
	// 1.) get Staff based on posted email
	let staff = await Staff.findOne({email:req.body.email});
	if(!staff){
		return next(new AppError('There is no Staff with email address', 404));
	}


	// 2.) generate random token
	var resetToken = staff.createOTP();
	//since we updated the passwordResetExpires field in our createOTP() function we now have to ensure it is saved into the db by using save() but sine there are some required fields as we are technically doing an update, we then use a special option in the save() which is validateBeforeSave and we set it to false
	await staff.save({validateBeforeSave: false});

	// 3.) send it to Staff as email
	//todo open mailtrap account
	

	
	const message = `Forgot your Password? Use this OTP alongside your email and new password to change your password: ${resetToken}.  If You Did'nt Forget Your Password Please Ignore This Email`;
	
	emailComposer(staff, message, "Your Password Reset Token (Valid For 10 Mins)", 'passwordReset');
	return res.status(200)
	.json({
		status: "success",
		message: "Your Password Reset Token Has Been Sent to Your Email"
	});

});





exports.verifyOTPClosure = (type) =>  catchAsync( async(req, res, next) => {
	console.log(req.body)
	const {email, password, OTP,passwordConfirm} = req.body;
  console.log(email,password)
  console.log(OTP,passwordConfirm)
   const staff = await Staff.findOne({email: email, otpExpires: {$gt:Date.now()}}).select('+password +emailValidateToken ');
  
   if(!staff){
	return next(new AppError('Token is invalid or has Expired', 400));
}
   if(staff.active === 'suspended' || staff.active === 'takenDown') return next(new AppError("Your Account is Currently Not Allowed to Perform this Action", 500));

   if(staff.active === 'verified' && type ==='emailVerify') return res.status(200).json({
	  status: "success",
	  message: "This Account Does Not Need to Verify it's Email"
  });




  
	  if(type === 'emailVerify'){
		if(!(await staff.validatePassword(password, staff.password))) return next(new AppError('Oops!!! Something Went Wrong 🤔🤔🤔 Wrong Input', 401));
	  }
		
		
	  
		if(  !(staff.validateOTP(OTP, staff.otpToken, type))) return next(new AppError('Oops!!! Something Went Wrong 🤔🤔🤔 Wrong Input', 401));
		else {
			if(type==='resetPassword'){
				staff.password = req.body.password;
				staff.passwordConfirm = req.body.passwordConfirm;
			}
			
			
		}	
		
		// here notice we do not turn off validation cos we need it
		
		let optionalMessage=staff.active;
		let {token, nuRes} =  createAndSendToken(staff, res );
   		staff.stoken = token;
   		let newStaff  = await staff.save({validateBeforeSave: false});
   
  		doTheNeedfulForLogin ({optionalMessage, statusCode:200, token, newStaff, nuRes});
	  
	
		 
	  
  
  
    


});








exports.updatePassword = catchAsync(async (req, res, next) => {
	let verifiedStatus;
	// 1.) get the current Staff
	const staff = await Staff.findById(req.staff.id).select('+password');



	// 2.) check if the current password is correct
	if(!(await staff.validatePassword(req.body.passwordCurrent, staff.password))){
		return next(new AppError('Your Current Password is Wrong', 401));
	}






	// 3.) if so, update password
	staff.password = req.body.password;
	staff.passwordConfirm = req.body.passwordConfirm;
	verifiedStatus=staff.active;
	await staff.save();


	// 4.) log Staff in
	createAndSendToken(staff, 200, res, verifiedStatus);

});

