
const catchAsync = require('../../../utils/catchControllerAsyncs.js');

const AppError = require('../../errorService/AppErrorModule.js');
const factory=require('../../../utils/factoryHandlers.js')
const ClockIn= require('../models/clockInModel.js')
const mongoose = require('mongoose')

exports.addClockIn=catchAsync(async(req,res,next)=>{
    
    let currentMonth= new Date(Date.now()).toLocaleString('default', { month: 'long' });
    console.log('i got here',currentMonth)
    console.log(req.staff.id)

    const createAndRespond=async ()=>{
         await ClockIn.create({staff:req.staff.id, count:1 });

            return res.status(200).json({
                status:"success",
                message:"user clock in updated for the new month"
            })
    }
    await ClockIn.find({ staff: req.staff.id },async function(err, docs){
        console.log('d doc', docs)
        if(err) return next(new AppError("Something Went Wrong", 500));

       
        if(docs.length === 0 ) {
            //if user has not clockecd in for a new month then create new one
           await createAndRespond()
        } else {
            //check if staff has already started clocking in for the present month
            let checkMonthIndex= docs.findIndex(e=>e.month.toString() === currentMonth.toString());

            if(checkMonthIndex === -1) {
                 //if user has not clockecd in for a new month then create new one
                await createAndRespond()
            } else {
                docs[checkMonthIndex].count=docs[checkMonthIndex].count+1;


            await docs[checkMonthIndex].save();

            return res.status(200).json({
                status:"success",
                message:"user clock In updated"
            })
            }
            
        }
        



    })




});




exports.getStaffClockin=(type)=>catchAsync(async(req,res,next)=>{

    let query = type === "admin" ? req.params.staffId : req.staff.id;
    await ClockIn.aggregate([
        {
            $match: { staff: mongoose.Types.ObjectId(query) }
            
        },

        

        {
            $lookup:{
                from : 'Staff',
                localField : 'staff',
                foreignField : '_id',
                as : 'staff'
            }
        },
        {
            $group: {
                _id: "$month",
                "id": {"$first": "$_id"},
                "count": {"$first": "$count"},
                "firstName": {"$first": "$staff.firstName"},
                "lastName": {"$first": "$staff.lastName"},
                "phone": {"$first": "$staff.phone"},
                "email": {"$first": "$staff.email"},
            }
        }
    ])
    .then((docs) => {
        if(!docs || docs.length ===0) return next(new AppError("Staff Clock in not found found", 404));
        return res.status(200).json({
            status:"success",
           data:docs
        })
    })
    .catch((err) => {
        console.log('the errrrr', err)
        return next(new AppError("Something Went Wrong", 500));
    })

    
})



exports.getAllStaffsClockin = catchAsync(async(req, res, next) => {

})