const catchControllerAsyncs = (funkshion) => {
		
		return (req, res, next) => {
			funkshion(req, res, next).catch((err)=> {
				next(err);
			});
		};
		


}

module.exports = catchControllerAsyncs;