
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
         await ClockIn.create({staff:req.staff.id, count:1});

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
          localField: 'staff',
          foreignField: '_id',
          as: 'staffDetails',
        },
      }
      let unwind = { $unwind: '$staffDetails'}
     let group =  {
        $group: {
            _id: "$month",
            count: {$first: '$count'},
            staff: {$first: '$staff'},
            
            staffDetails: {$first: '$staffDetails'}
            
                
        }
    }
    
    let project = {
        $project: {
            _id: 0,
            month: "$_id",
            data: {
                count: '$count',
                staff:'$staff',
                firstName: '$staffDetails.firstName',
                lastName: '$staffDetails.lastName',
                email: '$staffDetails.email',
                phone: '$staffDetails.phone'
            }
            
            
        }
    }

    let stages = [
        match, 
        lookup,
        unwind,
        group, 
        project
    ];
    
    
    await ClockIn.aggregate(stages).then((docs) => {
        console.log('docs', docs)
        let returner, code;
        if(!docs || docs.length ===0) [returner = {
            status: "failure",
            message:"Staff Clock in not found"
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
    

    let lookup = {
        $lookup: {
          from: 'staffs',
          localField: 'staff',
          foreignField: '_id',
          as: 'staffDetails',
        },
      }
      let unwind = { $unwind: '$staffDetails'}


      let project1 = {
      $project: {
          month: 1,
          count: 1,
          'staffDetails.firstName': 1,
          'staffDetails.lastName': 1,
          'staffDetails.email': 1,
          'staffDetails._id': 1
        }
      }
     let group =  {
     
     $group: {
        _id: '$month',
        data: {
          $push: {
            staff: '$staffDetails._id',
            firstName: '$staffDetails.firstName',
            lastName: '$staffDetails.lastName',
            email: '$staffDetails.email',
            count: '$count'
          }
        }
      }
    }
    
    
    let project2 = {
        $project: {
            _id: 0,
            month: '$_id',
            data: 1
            
            
            
        }
    }

    let stages = [
         
        lookup,
        unwind,
        project1,
        group, 
        project2
    ];
    
    
    await ClockIn.aggregate(stages).then((docs) => {
        console.log('docs', docs)
        let returner, code;
        if(!docs || docs.length ===0) [returner = {
            status: "failure",
            message:"Staffs Clock ins not found"
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



data= [
    {
        "firstName": null,
        "lastName": null,
        "email": "esther@outlook.com",
        "data": [
            {
                "_id": "64099a20eb59580035a5bc28",
                "month": "March",
                "createdAt": "2023-03-09T08:33:21.829Z",
                "staff": "6404cd885d15440034e74ff7",
                "count": 1,
                "__v": 0,
                "staffDetails": {
                    "_id": "6404cd885d15440034e74ff7",
                    "role": "staff",
                    "active": "verified",
                    "createdAt": "2023-03-05T17:10:18.341Z",
                    "email": "esther@outlook.com",
                    "password": "$2a$12$5MyaiQpsKhMbiG21jAwHtehg6H1hnaLUvCKywAmY35o72FjahUy5W",
                    "__v": 0,
                    "stoken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0MDRjZDg4NWQxNTQ0MDAzNGU3NGZmNyIsImlhdCI6MTY3ODE5NjcxNiwiZXhwIjoxNjgwNzg4NzE2fQ.N_T67lIFnuGEFPYbcrzjdbU1rxisZ4UDP7KRiYiwe8g"
                }
            },
            {
                "_id": "64099a51eb59580035a5bc2f",
                "month": "March",
                "createdAt": "2023-03-09T08:33:21.829Z",
                "staff": "6404cd3e5d15440034e74ff4",
                "count": 1,
                "__v": 0,
                "staffDetails": {
                    "_id": "6404cd3e5d15440034e74ff4",
                    "role": "staff",
                    "active": "verified",
                    "createdAt": "2023-03-05T17:10:18.341Z",
                    "email": "simi@outlook.com",
                    "password": "$2a$12$dkUFb8DNQmmttqm7QyFdT.A1kGoy.lTBZ7wLwxLza8ylqxC6Joyja",
                    "__v": 0,
                    "stoken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0MDRjZDNlNWQxNTQ0MDAzNGU3NGZmNCIsImlhdCI6MTY3ODM1MDkxMSwiZXhwIjoxNjgwOTQyOTExfQ.tPeX7uYM2p5zE7j77azvLm9PuxX2IeRBdOsaDoYpUDc"
                }
            },
            {
                "_id": "64099a70eb59580035a5bc36",
                "month": "March",
                "createdAt": "2023-03-09T08:33:21.829Z",
                "staff": "6404cd325d15440034e74ff1",
                "count": 1,
                "__v": 0,
                "staffDetails": {
                    "_id": "6404cd325d15440034e74ff1",
                    "role": "staff",
                    "active": "verified",
                    "createdAt": "2023-03-05T17:10:18.341Z",
                    "email": "toluwa@outlook.com",
                    "password": "$2a$12$1uGsKstpV1OoA63.X2rj/usw3AGURS0wfZrJzLMsbCal2QUyiw/ue",
                    "__v": 0,
                    "stoken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0MDRjZDMyNWQxNTQ0MDAzNGU3NGZmMSIsImlhdCI6MTY3ODM1MDk0NywiZXhwIjoxNjgwOTQyOTQ3fQ.jBNhyeXF5XOqsCYg3QtvaB-nhSdQqKmbXxmizvjrjlY"
                }
            },
            {
                "_id": "64099a8ceb59580035a5bc3d",
                "month": "March",
                "createdAt": "2023-03-09T08:33:21.829Z",
                "staff": "6404cd0e5d15440034e74fee",
                "count": 1,
                "__v": 0,
                "staffDetails": {
                    "_id": "6404cd0e5d15440034e74fee",
                    "role": "staff",
                    "active": "verified",
                    "createdAt": "2023-03-05T17:10:18.341Z",
                    "email": "osas@outlook.com",
                    "password": "$2a$12$pQnnTiiH.btorHgz3mWGRuZ0YO./hLwoWa7dNen9UpcXewCWrTBi2",
                    "__v": 0,
                    "stoken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0MDRjZDBlNWQxNTQ0MDAzNGU3NGZlZSIsImlhdCI6MTY3ODM1MDk3NSwiZXhwIjoxNjgwOTQyOTc1fQ.veEEmt1ERRiyNmJEMZUOHigO-5_DovQ_36eCcnjNvkA"
                }
            }
        ],
        "month": "March"
    }
]