const nodemailer = require('nodemailer');

const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
	constructor(options){
		console.log("constructor ", options)
		this.to = options.staff.email;
		if(!!options.staff.firstName){
			this.firstName=options.staff.firstName;
		} else {
			 this.firstName=options.staff.email.split("@")[0];
		}
		this.message = options.message;
		this.subject = options.subject;
		this.template = options.template;
		this.from = `Enter Scale ${process.env.EMAIL_FROM}`;

		console.log('firstname', this.firstName)
	}


	newTransport(){
		
		return nodemailer.createTransport({
				// service: 'Gmail',
				 host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "6c5f0beb2c513f",
    pass: "c6c4c2961ab8f7"
  }
				//activate in gmail less secure apps
			});
	}

	 async send(){
		// render html based on a pug template
		const html = pug.renderFile(`${__dirname}/../views/email/${this.template}.pug`, {
			firstName: this.firstName,
			message: this.message,
			subject: this.subject
		});


		// define email mailOptions
		const mailOptions = {
			from: this.from,
			to: this.to,
			subject: this.subject,
			
			html: htmlToText.fromString(html)
		}


		//create a transport and send Email

		 await this.newTransport().sendMail(mailOptions);
	}

}


