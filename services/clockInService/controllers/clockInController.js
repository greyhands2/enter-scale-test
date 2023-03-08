
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
         await ClockIn.create({staff:req.staff.id, count:1, email: req.staff.email });

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
    let match = {
        $match: { staff: mongoose.Types.ObjectId(query) }
        
    }

    let lookup = {
        $lookup: {
          from: 'staffs',
          localField: 'email',
          foreignField: 'email',
          as: 'staffDetails',
        },
      }
      let unwind = { $unwind: '$staffDetails'}
     let group =  {
        $group: {
            _id: "$month",
            count: {$first: '$count'},
            staff: {$first: '$staff'},
            email: {$first: '$email'},
            staffDetails: {
                "$push": {
                    "firstName": "$staffDetails.firstName",
                    "lastName": "$staffDetails.lastName",
                    "phone": "$staffDetails.phone"
                }
            }
           
            
            
        }
    }
    
    let project = {
        $project: {
            _id: 0,
            month: "$_id",
            count: 1,
            staff:1,
            email:1,
            'staffDetails.firstName': 1,
            'staffDetails.lastName':1,
            'staffDetails.phone': 1
        }
    }

    let stages = [
        match, 
        lookup,
        unwind,
        group, 
        //project
    ];
    
    
    await ClockIn.aggregate(stages).then((docs) => {
        console.log('docs', docs)
        let returner, code;
        if(!docs || docs.length ===0) [returner = {
            status: "failure",
            message:"Staff Clock in not found found"
        }, code = 404];

        
       else [ returner = {
            status:"success",
           data:docs
        }, code = 200 ]


        return res.status(code).json(returner)
    })
    .catch((err) => {
        console.log('the err', err)
        return next(new AppError("Something Went Wrong", 500));
    })

    
})



exports.getAllStaffsClockin = catchAsync(async(req, res, next) => {

})