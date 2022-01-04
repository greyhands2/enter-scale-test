const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');

//get global url base name
const globs = process.env.BASE_NAME;
//initialize express
const app = express();

app.enable('trust proxy');
//initialize pug for email ui
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
//enabling cors
app.use(cors());
app.options('*', cors());
app.use(helmet());

// data sanitization against nosql query injection
app.use(mongoSanitize());

//data sanitization xSS attack
app.use(xss());


const limiter = rateLimit({
	// depends on the nature of your api usage
	max: 100,
	// set time limit to 1hr
	windowMs: 60 * 60 * 1000,
	message: 'Too many requests from this IP, try again in an hour'
})
app.use('/enter_scale_staff_api', limiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression());
app.use((req, res, next) => {

	req.requestTime = new Date().toISOString();

	next();
});

//allow only valid endpoints
require('./validEndPoints.js').forEach((cur)=>{
	app.use(`${globs}/${cur}`, require(`./services/${cur}/routes/${cur}Routes.js`));
})


app.all('*', (req, res, next) => {
	
	// error  initializing by using  the Error class object
//using next() to pass error into express
	const AppError = require('./services/errorService/AppErrorModule.js');
	next(new AppError(`Can't find ${req.originalUrl}  on this server!! 😫`, 404));
});

// using express's error handling middleware

app.use(require('./services/errorService/errorController.js'));

module.exports = app;