const Queue = require('bull');
const Email = require('./MyEmailer');
const emailerQueuett = new Queue('emailerQueuett', process.env.REDIS_URL);




const emailComposer =  (staff, message, subject, template)=> {
    let data = {};

    console.log("i got here", staff)
    data.email = {
        staff,
        subject: subject,
        message: message,
        template: template
    };




    emailerQueuett.add(data);

}


emailerQueuett.process(doWork);



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



emailerQueuett.on('completed', function (job) {

    if(job.thata==="restart") {

        let jobOptions = {

            repeat: {cron: '* * * * *'},
            jobId: job.id,
            removeOnComplete: true


          };
          const redoemailerQueuett = new Queue('redoemailerQueuett', process.env.REDIS_URL);
        redoemailerQueuett.add(job.data, jobOptions);
        const initRetryQueue = () =>  redoemailerQueuett.process(doWork);
        initRetryQueue();

redoemailerQueuett.on('completed',  async function (job) {

    if(job.thata==="finished") {

      

          
          
          await redoemailerQueuett.removeRepeatable(job.name, { ...job.opts.repeat });

        //redoemailerQueuett.close();
      }
    });
      }
});




module.exports = emailComposer;
