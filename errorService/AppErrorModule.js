class AppError extends Error {

	constructor(message, statusCode){
		// initiate the parent's class contructor with super
		super(message);
		this.statusCode = statusCode;
		this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

		//we mostly use this error class for operational errors, errors from using the api not bugs from the api code, e.g network problem

		this.isOperationalError = true;

		// we also wanna capture the error stacktrace
		Error.captureStackTrace(this, this.constructor);

	}


}

module.exports = AppError;