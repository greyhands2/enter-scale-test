const APIFeatures = require('./APISpecialFeatures.js');

const catchAsync = require('./catchControllerAsyncs.js');
const AppError = require('../services/errorService/AppErrorModule.js');

// we use factory functions here..they are functions that return other functions
exports.deleteOne = (Model)=> catchAsync(async (req, res, next)=> {

		 const doc = await Model.findByIdAndDelete(req.params.id);

		 if(!doc){
			return next(new AppError('No Document found with that ID', 404));
		}
		 
		res.status(200)
		.json({
			status: "success",
			message: "deleted"
		});
	
});


exports.getOne = (Model, populateOptions=false) => catchAsync(async (req, res, next)=> {


let query = Model.findById(req.params.id);

if(req.body.populate) populateOptions = req.body.populate;
if(populateOptions ) query = query.populate(populateOptions);

const doc = await query.select('-__v -active -passwordChangedAt');
		

		if(!doc){
			return next(new AppError('No Document found with that ID', 404));
		}



		res.status(200)
		.json({
			status: "success",
			data: {
				data: doc
			}
		});

	

});


exports.getAll = (Model) =>  {
	

 return catchAsync(async (req, res, next) => {
	
	/****         ******/
	// giving room for nested routes in our get all tours controller
	let filter = {};
	if(req.params.userId) filter = { user: req.params.userId};
	
	/******       *****/
	//give room for multiple filter whet getting all from leaderBoard
	if(req.body) filter = {...filter, ...req.body};
	//	
	

 const features = new APIFeatures(Model.find(filter), req.query).filterer().sorter().fieldLimiter().paginator();

// execute query

//explain() when attached to a query returns statistics about the query like executionStats that would show no.s of docs scanned and no.s of results..we could use this to track the effectiveness of the indexes we create
	// const docs = await features.queryModel.explain();
	
	const docs = await features.queryModel;

// send response
	res.status(200).json({
		status: 'success',
		results: docs.length,
		data: {
		 data: docs
		},

	});	


	
	
});

}


