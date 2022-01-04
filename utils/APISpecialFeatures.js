class APISpecialFeatures {

	constructor(queryModel, queryString){
		this.queryModel = queryModel;
		this.queryString = queryString;
	}

	filterer(){
		// create a copy of queryString to be used in this function
		const filterQueryObj = {...this.queryString};
		// we exclude these fields because our filtering doesn't need them
		const fieldsToExclude = ['page', 'sort', 'limit', 'fields'];
	
		fieldsToExclude.forEach((field) => delete( filterQueryObj[field]));

		// so we add gte, lte, ne
		let queryStr = JSON.stringify(filterQueryObj);
		queryStr = JSON.parse(queryStr.replace(/\b(gte|gt|lte|lt|ne|-ne)\b/g, match => `$${match}`));
		// update the this object with the mongodb find query

		this.queryModel = this.queryModel.find(queryStr);

		// finally return the newly modified this object so as to be available to other mthods in this class
		return this;
	}


	sorter(){
		if(this.queryString.sort){
			// in query url the sort values would be seperated by commas but mongoose uses space so we replace the commas with spaces.
			//e.g sort=-prize,duration

			const sortBy = this.queryString.sort.split(",").join(' ');

			// finally sort with mongoose but update the this queryModel object
			this.queryModel = this.queryModel.sort(sortBy);
		} else {
			// if we didnt pass any sort values we want the default sort to be by created date inversely of course so the most recent shows first and we do that using "-"
			this.queryModel = this.queryModel.sort("-dateCreated");
		}




		return this;
	}


	fieldLimiter(){
		if(this.queryString.fields){
			const fields = this.queryString.fields.split(",").join(' ');
			this.queryModel = this.queryModel.select(fields);
		} else {
			// if we didnt specify any field limits we want to remove the __v field by default that coms with a mongodb query result, so of course we make use of the - sign


		//use mongoose to disselect the __v field 
			this.queryModel = this.queryModel.select('-__v');
		}





		return this;
	}




	paginator(){
		// we dont need to check if this.queryString.page exists because we wanna paginate too by dafault

		// set our page to number by multplying strng by 1 or to page 1 by default if a page isnt passed in the queryString and sam for limt too
		const page = this.queryString.page*1 || 1;
		const lim = this.queryString.limit*1 || 50;
		// this is the variable the mongoose uses to skip
		const skip = (page -1) * lim;

		this.queryModel = this.queryModel.skip(skip).limit(lim);

		return this;
	}

}


module.exports = APISpecialFeatures;