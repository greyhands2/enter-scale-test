const Queue = require('bull');
const Email = require('./MyEmailer');
const emailerQueuettyip = new Queue('emailerQueuettyip', process.env.REDIS_URL);




const emailComposer =  (staff, message, subject, template)=> {
    let data = {};

    console.log("i got here", staff)
    data.email = {
        staff,
        subject: subject,
        message: message,
        template: template
    };




    emailerQueuettyip.add(data);

}


emailerQueuettyip.process(doWork);



async function doWork(job, done){

    try {
        //todo uncomment below commented code
        console.log('proof redis works', job.data)
        let emailObj= new Email(job.data.email)
        await emailObj.send();

        job.thata="finished";
        done(false);
    } catch(e){

        job.thata = "restart";
        done(false);
    }

}



emailerQueuettyip.on('completed', function (job) {

    if(job.thata==="restart") {

        let jobOptions = {

            repeat: {cron: '* * * * *'},
            jobId: job.id,
            removeOnComplete: true


          };
          const redoemailerQueuettyip = new Queue('redoemailerQueuettyip', process.env.REDIS_URL);
        redoemailerQueuettyip.add(job.data, jobOptions);
        const initRetryQueue = () =>  redoemailerQueuettyip.process(doWork);
        initRetryQueue();

redoemailerQueuettyip.on('completed',  async function (job) {

    if(job.thata==="finished") {

      

          
          
          await redoemailerQueuettyip.removeRepeatable(job.name, { ...job.opts.repeat });

        //redoemailerQueuettyip.close();
      }
    });
      }
});




module.exports = emailComposer;
