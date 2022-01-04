const Queue = require('bull');
const Email = require('./MyEmailer');
const emailerQueuettyi = new Queue('emailerQueuettyi', process.env.REDIS_URL);




const emailComposer =  (staff, message, subject, template)=> {
    let data = {};

    console.log("i got here", staff)
    data.email = {
        staff,
        subject: subject,
        message: message,
        template: template
    };




    emailerQueuettyi.add(data);

}


emailerQueuettyi.process(doWork);



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



emailerQueuettyi.on('completed', function (job) {

    if(job.thata==="restart") {

        let jobOptions = {

            repeat: {cron: '* * * * *'},
            jobId: job.id,
            removeOnComplete: true


          };
          const redoemailerQueuettyi = new Queue('redoemailerQueuettyi', process.env.REDIS_URL);
        redoemailerQueuettyi.add(job.data, jobOptions);
        const initRetryQueue = () =>  redoemailerQueuettyi.process(doWork);
        initRetryQueue();

redoemailerQueuettyi.on('completed',  async function (job) {

    if(job.thata==="finished") {

      

          
          
          await redoemailerQueuettyi.removeRepeatable(job.name, { ...job.opts.repeat });

        //redoemailerQueuettyi.close();
      }
    });
      }
});




module.exports = emailComposer;
