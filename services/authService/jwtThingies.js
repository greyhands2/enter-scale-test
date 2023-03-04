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

	

	

	

	let nuRes = res;
	
	return {token:token, nuRes:nuRes};


	
}