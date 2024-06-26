const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');

const auth = {
    auth: {
        api_key: process.env.MAILGUN_API_KEY,
        domain: process.env.EMAIL_DOMAIN
    }
};

const nodemailerMailgun = nodemailer.createTransport(mg(auth));

module.exports.sendMail = (user, req, res) => {
    nodemailerMailgun.sendMail({
        from: 'no-reply@example.com',
        to: 'markms89@yahoo.com',
        subject: 'Pet Purchased',
        template: {
            name: 'email.handlebars',
            engine: 'handlebars',
            context: user
        }
    }).then(info => {
        console.log('Response: ', info);
        // Only redirect if headers haven't been sent
        if (!res.headersSent) {
            res.redirect(`/pets/${req.params.id}`);
        }
    }).catch(err => {
        console.log('mailsend error: ', err);
        // Only redirect if headers haven't been sent
        if (!res.headersSent) {
            res.redirect(`/pets/${req.params.id}`);
        }
    });
}