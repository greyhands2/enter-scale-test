
const catchAsync = require('../../../utils/catchControllerAsyncs.js');

const AppError = require('../../errorService/AppErrorModule.js');
const factory=require('../../../utils/factoryHandlers.js')
const ClockIn= require('../models/clockInModel.js')


exports.addClockIn=catchAsync(async(req,res,next)=>{
    console.log('i got here')
    await ClockIn.findOne({staff:req.params.staffId},async function(err, doc){

        if(err) return next(new AppError("Something Went Wrong", 500));

        if(Object.keys(doc).length ===0) return next(new AppError("Staff not found", 404));

        if(doc.month === new Date(Date.now()).toLocaleString('default', { month: 'long' })){
            doc.count=doc.count+1;

            await doc.save();

            return res.status(200).json({
                status:"success",
                message:"user clock in updated"
            })
        } else {
            await ClockIn.create({staff:req.params.staffId, count:1 });

            return res.status(200).json({
                status:"success",
                message:"user clock in updated for the new month"
            })
        }



    })

});




exports.getStaffClockin=catchAsync(async(req,res,next)=>{



    await ClockIn.find({staff:req.params.staffId}, async function(err, docs){

        if(err) return next(new AppError("Something Went Wrong", 500));

        if(docs.length ===0) return next(new AppError("Staff Clock in not found found", 404));


         return res.status(200).json({
                status:"success",
               data:docs
            })

    })
})



exports.getAllStaffsClockin=factory.getAll(ClockIn);