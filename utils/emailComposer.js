const Queue = require('bull');
const Email = require('./MyEmailer');
const emailerQueue = new Queue('emailerQueue', process.env.REDIS_URL);




const emailComposer =  (staff, message, subject, template)=> {
    let data = {};


    data.email = {
        staff,
        subject: subject,
        message: message,
        template: template
    };




    emailerQueue.add(data);

}


emailerQueue.process(doWork);



async function doWork(job, done){

    try {
        //todo uncomment below commented code

        await new Email(job.data.email).send();

        job.thata="finished";
        done(false);
    } catch(e){

        job.thata = "restart";
        done(false);
    }

}



emailerQueue.on('completed', function (job) {

    if(job.thata==="restart") {

        let jobOptions = {

            repeat: {cron: '* * * * *'},
            jobId: job.id,
            removeOnComplete: true


          };
          const redoemailerQueue = new Queue('redoemailerQueue', process.env.REDIS_URL);
        redoemailerQueue.add(job.data, jobOptions);
        const initRetryQueue = () =>  redoemailerQueue.process(doWork);
        initRetryQueue();

redoemailerQueue.on('completed',  async function (job) {

    if(job.thata==="finished") {

      

          
          
          await redoemailerQueue.removeRepeatable(job.name, { ...job.opts.repeat });

        //redoemailerQueue.close();
      }
    });
      }
});




module.exports = emailComposer;
