const Queue = require('bull');
const Email = require('./MyEmailer');
const emailerQueuet = new Queue('emailerQueuet', process.env.REDIS_TLS_URL);




const emailComposer =  (staff, message, subject, template)=> {
    let data = {};

    console.log("i got here", staff)
    data.email = {
        staff,
        subject: subject,
        message: message,
        template: template
    };




    emailerQueuet.add(data);

}


emailerQueuet.process(doWork);



async function doWork(job, done){

    try {
        //todo uncomment below commented code
        console.log('proof redis works', job.data)
        await new Email(job.data.email).send();

        job.thata="finished";
        done(false);
    } catch(e){

        job.thata = "restart";
        done(false);
    }

}



emailerQueuet.on('completed', function (job) {

    if(job.thata==="restart") {

        let jobOptions = {

            repeat: {cron: '* * * * *'},
            jobId: job.id,
            removeOnComplete: true


          };
          const redoemailerQueuet = new Queue('redoemailerQueuet', process.env.REDIS_URL);
        redoemailerQueuet.add(job.data, jobOptions);
        const initRetryQueue = () =>  redoemailerQueuet.process(doWork);
        initRetryQueue();

redoemailerQueuet.on('completed',  async function (job) {

    if(job.thata==="finished") {

      

          
          
          await redoemailerQueuet.removeRepeatable(job.name, { ...job.opts.repeat });

        //redoemailerQueuet.close();
      }
    });
      }
});




module.exports = emailComposer;
