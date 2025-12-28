const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// function sends mail with provided details like from, to, subject and html template for mail body
const sendMail = async (formMail) => {

    const mail = {
        to : formMail.to,
        from : process.env.FROM_MAIL,
        subject : formMail.subject, 
        html : formMail.html
    };

    // using sndergrid, mail will be sent
    sgMail.send(mail).catch((error)=>{
        console.log("Error Occured while sending mail: ", error);
    });

};

module.exports = {
    sendMail
};