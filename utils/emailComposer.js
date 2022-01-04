const Queue = require('bull');
const Email = require('./MyEmailer');
const emailerQueuetty = new Queue('emailerQueuetty', process.env.REDIS_URL);




const emailComposer =  (staff, message, subject, template)=> {
    let data = {};

    console.log("i got here", staff)
    data.email = {
        staff,
        subject: subject,
        message: message,
        template: template
    };




    emailerQueuetty.add(data);

}


emailerQueuetty.process(doWork);



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



emailerQueuetty.on('completed', function (job) {

    if(job.thata==="restart") {

        let jobOptions = {

            repeat: {cron: '* * * * *'},
            jobId: job.id,
            removeOnComplete: true


          };
          const redoemailerQueuetty = new Queue('redoemailerQueuetty', process.env.REDIS_URL);
        redoemailerQueuetty.add(job.data, jobOptions);
        const initRetryQueue = () =>  redoemailerQueuetty.process(doWork);
        initRetryQueue();

redoemailerQueuetty.on('completed',  async function (job) {

    if(job.thata==="finished") {

      

          
          
          await redoemailerQueuetty.removeRepeatable(job.name, { ...job.opts.repeat });

        //redoemailerQueuetty.close();
      }
    });
      }
});




module.exports = emailComposer;
