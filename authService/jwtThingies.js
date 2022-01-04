const jwt = require('jsonwebtoken');

const signToken = (id) => {
	return jwt.sign(
		{id: id},
		process.env.JWT_SEACRIIT,
		{
			expiresIn: process.env.JWT_EXPIRE
		});
}




exports.createAndSendToken = (staff, res) => {
	const token = signToken(staff._id);

	const cookieOptions = {
		// store expiring date in milliseconds

		expires: new Date(Date.now() + process.env.JWT_EXPIRE * 24 * 60 * 60 * 1000),
		httpOnly: true
	};


	if(process.env.NODE_ENV==='production') cookieOptions.secure=true;

	res.cookie('jwt', token, cookieOptions);

	//remove password from response object

	let nuRes = res;
	
	return {token:token, nuRes:nuRes};


	
}