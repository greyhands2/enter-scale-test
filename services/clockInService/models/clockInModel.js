// review/ rating/ createdAt/ ref to tour /ref to user

const mongoose =  require('mongoose');

const validator = require('validator');

const ClockInSchema = new mongoose.Schema({

	count: Number,
    month:{
        type:String,
        default: new Date(Date.now()).toLocaleString('default', { month: 'long' })
    },
	
	staff:{
        type: mongoose.Schema.ObjectId,
        ref: 'Staff',
        required: [true, 'Every Clock in must belong to a Staff'],
    },
	createdAt: {
		type: Date,
		default: Date.now()


	}



}, {
	// give room for virtualization when passing the schema
		toJSON: {virtuals: true},
		toObject: {virtuals: true}
});


const ClockIn = mongoose.model('ClockIn', ClockInSchema);
module.exports = ClockIn;