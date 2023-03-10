exports.fetchStaffSetPopulation =  (req, res, next) => {
	
	if(req.staff.role === 'staff') req.body.populate= [{path: 'clockIns', select: 'count month -id -_id -staff'}];
		
	
	
	next();
}