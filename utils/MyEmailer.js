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
	}


	newTransport(){
		
		return nodemailer.createTransport({
				// service: 'Gmail',
				host: process.env.EMAIL_HOST,
				port: process.env.EMAIL_PORT,
				auth: {
					staff: process.env.EMAIL_USERNAME,
					pass:process.env.EMAIL_PASSWORD
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


