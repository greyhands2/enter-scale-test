const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const StaffSchema = new mongoose.Schema({
	
	firstName:String,
	lastName:String,
	
	phone: {

		type: String,
		index: true,
		unique: true,
		sparse: true,
	},

	email: {
		type: String,
		required: [true, 'Please Specify an Email 🙄'],
		index:true, 
		unique:true,
		sparse:true,
		lowercase: true,
		validate: [validator.isEmail, 'Please Specify a Valid Email 😏']
	},
	
	role: {
		type: String,
		enum: ['staff', 'admin'],
		default: 'staff'

	},
	password: {
	 	type: String,
	 	required: [true, 'Please Provide a Password'],
	 	minLength: 8,
	 	//ensure password is neevr returned by a query
	 	select: false
	 },
	 passwordConfirm: {
	 	type: String,
	 	required: [true, 'Please Confirm Your Password'],
	 	validate: {
	 		// this only works on save() or create() so when updating a Staff we have to still use save() or create() so this password validation works
	 		validator: function(el) {
	 			return el === this.password; //this returns true if both passwords are equal else returns false
	 		},
	 		message: 'Passwords aint the same'
	 	},
	 	select:false
	 },
     dob:Date,
	 passwordChangedAt: Date,
	 
	 otpExpires: Date,
	 active: {
		type: String,
		//unveriified is the default state a Staff's  account is in before he verifies his email then it becomes verified, suspended is when admn deactivates temporarily a Staff's account for any flouting of rules, deteled is when the Staff deactivates his/her account personally and he/she can reactivate it back to unverified thereby needing to verify email again. takenDown is when admin permanently deactivates a Staff's account
		enum: ["unverified", "verified", "suspended", "deleted", "takenDown"],
		default: "unverified"
	 },
	 
	 otpToken: String,
	 createdAt: {
			type: Date,
			default: Date.now(),
			//if we never want to return createdAt field
			select: false
		},

	stoken: String,
		

}, {
		// give room for virtualization when passing the schema
		toJSON: {virtuals: true},
		toObject: {virtuals: true}
	});

// use a mongoose middleware to hash passwords
// remember since we wanna hash the passwords before it is saved it is only mongoose document middleware that is suitable here, the "pre" variation of course

StaffSchema.virtual('clockIns', {

	ref: 'ClockIn',
	// the foreign field is the name of the relating field in the schema we wanna relate our tourSchema to
	foreignField: 'Staff',
	// and locally in tourSchema it is with _id that tourSchema can be referenced in the review model
	localField: '_id'
	

});



//middlewares
StaffSchema.pre('save', async function(next){
	// first use mongoose internal boolean function isModified to check if password field has been modified or not if it has not been modified then we do not need to hash, if it has then we hash
	if(!this.isModified('password')) return next();
	
		// use bcrypt for hashing
		// bcrypt salts each password meaning it adds a random string to a passwrd before hashing so that even 2 equal passwords dont generate the same hash

		// note this is the async hash version that returns a promise
		
		this.password = await bcrypt.hash(this.password, 12);

		this.passwordConfirm = undefined;


		next();

	
});




//use middleware
StaffSchema.pre('save', function(next){
// if password wasnt changed or document is new exit this middlware
if(!this.isModified('password') || this.isNew) return next();

this.passwordChangedAt = Date.now() - 1000;
next();

});


//query middleware, to ensure all queries only return documents that have active set to verified
StaffSchema.pre(/^find/, function(next){
	// this points to the current query
	this.find({active: "verified"});

	
	
	next();
})



StaffSchema.pre(/^findOne/, function(){
	this.find({active: {$ne: "takenDown"}});

})







StaffSchema.pre(/^findOneAndUpdate/, function(next){

	this.find({$or: [{active: "unverified"}, {active: "deleted"}] });

	next();


})


//static instance methods

StaffSchema.methods.validatePassword = async function(candidatePassword, StaffPassword){
	
	//compare function returns true or false that can be accessed in any file where the StaffSchema has been imported
	return await bcrypt.compare(candidatePassword, StaffPassword);
}


StaffSchema.methods.validateOTP =  function(candidateToken, token, type){

	//compare function returns true or false that can be accessed in any file where the StaffSchema has been imported
	if(crypto.createHash('sha256').update(candidateToken).digest('hex') === token){
		
		this.otpToken = undefined;
		
		this.otpExpires = undefined;
		if(type === 'emailVerify') this.active = "verified"; 
		return true;	
	}

	return false;
}




StaffSchema.methods.afterChangeOfPassword = function(JWTTimestamp){

	if(this.passwordChangedAt){
		//
		const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
		// if this returns true it means password has been changed and if it returns false it means password has not been changed
		return JWTTimestamp < changedTimestamp;
	}

// means password not changed
	return false;
}






StaffSchema.methods.createOTP = function(){

	var digits = '0123456789'; 
    let OTP = ''; 
    for (let i = 0; i < 6; i++ ) { 
        OTP += digits[Math.floor(Math.random() * 10)]; 
    } 

    this.otpToken = crypto.createHash('sha256').update(OTP).digest('hex');
	this.otpExpires = Date.now() + 4 * 60 * 1000;
    return OTP;

	

}







const Staff = mongoose.model('Staff', StaffSchema);
module.exports = Staff;

