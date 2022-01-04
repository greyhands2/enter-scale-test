module.exports = (req, res, next) => {
	req.params.id = req.staff.id;
	next();


}