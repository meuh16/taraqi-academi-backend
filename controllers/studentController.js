const Sequelize = require('sequelize')
const validator = require('validator')
const {phone} = require('phone')
const Op = Sequelize.Op;
const nodemailer = require("nodemailer");
const Bcrypt = require("bcrypt");
const uuid = require("uuid");
const jwt = require("jsonwebtoken");
var fs = require('fs')
const Path = require('path');

const Student = require('../models/student')
const Notification = require('../models/notifications')
// const Answer = require('../models/answer')
const Exam = require('../models/exam')
const Group = require('../models/group')
// const Question = require('../models/question')
const StudyProgram = require('../models/studyProgram')
const Teacher = require('../models/teacher');
const studentStudyProgram = require('../models/studentStudyProgram');
const Subscription = require('../models/subscription');
const StudentExam = require('../models/StudentExam');
const StudentGroup = require('../models/StudentGroup');
const groupExam = require('../models/groupExam');
const exam = require('../models/exam');
const student = require('../models/student');




module.exports.register = async (req, res) => {
    try {
      console.log(req.body)
      const { firstName, familyName, phoneNumber, birthDate, country, wilaya, email, password, confirmPassword } = req.body
      // validation 
      const errors = []

      if(validator.isDate(birthDate)){
        const birthdate = new Date(birthDate);
        const currentDate = new Date();
        const age = currentDate.getFullYear() - birthdate.getFullYear();
        if(age >= 10){
          // everything is good here
        }else{
          errors.push({field: 'birthDate', message: 'العمر يجب أن يكون أكبر من 10 سنوات'})
        }
      }else{
        errors.push({field: 'birthDate', message: 'تاريخ الميلاد مطلوب'})
      }

      if(phoneNumber && phoneNumber.length > 0){
        if(country == 'الجزائر'){
          if(phone('+213' + phoneNumber).isValid){
            // good
          }else{
            errors.push({field: 'phoneNumber', message: 'أدخل رقم هاتف صالح فقط'})
          }
        }else{
          if(phoneNumber.length < 10){
            errors.push({field: 'phoneNumber', message: 'أدخل رقم هاتف صالح فقط'})
          }
        }
      }else{
        errors.push({field: 'phoneNumber', message: 'رقم الهاتف مطلوب'})
      }

      if(firstName && firstName.length < 3){
        errors.push({field: 'firstName', message: 'يجب أن يحتوي الاسم على أكثر من حرفين'})
      }else if(firstName && firstName.length > 100){
        errors.push({field: 'firstName', message: 'يجب ألا يحتوي الاسم على أكثر من 100 حرف'})
      }else if(firstName.length > 3 && firstName.length < 100){
        // good
      } else{
        errors.push({field: 'firstName', message: 'الاسم مطلوب'})
      }

      if(familyName && familyName.length < 3){
        errors.push({field: 'familyName', message: 'يجب أن يحتوي اللقب على أكثر من حرفين'})
      }else if(familyName && familyName.length > 100){
        errors.push({field: 'familyName', message: 'يجب ألا يحتوي اللقب على أكثر من 100 حرف'})
      }else if(familyName.length > 3 && familyName.length < 100){
        // good
      }else{
        errors.push({field: 'familyName', message: 'اللقب مطلوب'})
      }


      if(country){
        if(country.length < 3){
          errors.push({field: 'country', message: 'يجب أن يحتوي البلد على أكثر من حرفين'})
        }else if(country.length > 100){
          errors.push({field: 'country', message: 'يجب ألا يحتوي البلد على أكثر من 100 حرف'})
        }else{
          // good
        }
      }else{
        errors.push({field: 'country', message: 'البلد مطلوب'})
      }

      if(wilaya){
        if(wilaya.length < 2){
          errors.push({field: 'wilaya', message: 'يجب أن تحتوي الولاية على أكثر من حرفين'})
        }else if (wilaya.length > 100){
          errors.push({field: 'wilaya', message: 'يجب ألا تحتوي الولاية على أكثر من 100 حرف'})
        }else{
          // good
        }
      }else{
        errors.push({field: 'wilaya', message: 'الولاية مطلوبة'})
      }

      if(email && email.length > 0){
        if(validator.isEmail(email)){
          const exist = await Student.findOne({
            where: {
              email
            }
          })
          if(exist){
            errors.push({field: 'email', message: 'حساب آخر تم إنشاؤه بهذا البريد الإلكتروني، جرّب بريدًا إلكترونيًا مختلفًا'})
          }
        }else{
          errors.push({field: 'email', message: 'أدخل بريداً إلكترونياً صالحاً'})
        }
      }else{
        errors.push({field: 'email', message: 'البريد الإلكتروني مطلوب'})
      }

      if(password && password.length < 8){
        errors.push({field: 'password', message: 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل'})
      }else if(password.length > 7){
        // good
      }else{
        errors.push({field: 'password', message: 'كلمة المرور مطلوبة'})
      }

      if(confirmPassword && (confirmPassword != password)){
        errors.push({field: 'confirmPassword', message: 'كلمة المرور وتأكيد كلمة المرور ليستا متماثلتين'})
      }else if(confirmPassword == password){
        // good
      }else{
        errors.push({field: 'confirmPassword', message: 'تأكيد كلمة المرور  مطلوب'})
      }
      console.log(errors)
      if( errors.length > 0){
        res.status(400).send({response: 'invalid_params', errors, message: 'بيانات غير صالحة، تحقق منها مرة أخرى'})
      }else{
        const passwordSalte = await Bcrypt.genSalt();
        const hashed_password = await Bcrypt.hash(password, passwordSalte)

        var random = uuid.v4()
        const salte = await Bcrypt.genSalt();
        const hashed_email_code = await Bcrypt.hash(random, salte)

        const student = await Student.create({
          firstName,
          familyName,
          phoneNumber,
          birthDate,
          country,
          wilaya,
          email,
          description: 'طالب قرآن ',
          image: '',
          password: hashed_password,
          random_email_code: hashed_email_code,
        })
        await Notification.create({
          studentId: student.id
        })

        var transporter = nodemailer.createTransport({
          // host: process.env.MailerHost,
          // port: process.env.MailerPort, // or your SMTP server's port number
          service: 'gmail',
          auth: {
              user: process.env.MailerUser,
              pass: process.env.MailerPass
          }
        });

        require.extensions['.html'] = function (module, filename) {
          module.exports = fs.readFileSync(filename, 'utf8');
        };
        const maxAge= 60*60*6
        var c_email_code = jwt.sign({ random_email_code: random }, process.env.mailHash, { expiresIn: maxAge })
        var c_email_id = jwt.sign({ email: email }, process.env.mailHash, { expiresIn: maxAge })

        

        var mailOptions = {
          from: '"Taraqi Academi" <' + process.env.MailerUser + '>',
          to: email,
          subject: 'تأكيد البريد الإلكتروني',
          html: `<!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Document</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap" rel="stylesheet">
              <style>
                  body {
                      font-family: Cairo !important;
                      width: 100%;
                      text-align: center; /* Aligning children to the center */
                  }
                  .container {
                      height: 100%;
                      width: 100%;
                      background-color: white;
                      display: flex;
                      justify-content: start !important;
                      align-items: center !important;
                      flex-direction: column !important; 
                  }
                  .content {
                      margin: 0px 20px;
                      max-width: 600px;
                      width: 100%;
                      background-color: white;
                      padding: 10px 20px;
                      border: 1px solid lightgray;
                      min-height: 400px;
                      border-radius: 20px;
                      display: block !important; 
                      flex-direction: column !important ;
                      justify-content: start !important ;
                      align-items: center  !important;
                  }
                  img {
                      width: 200px;
                      height: auto;
                      /* margin: auto; Centering the image horizontally Removed */
                      display: block;
                      margin-left: auto;
                      margin-right: auto;
                      align-self: center !important;
                  }
                  h2 {
                      text-align: right;
                      border-top: 1px solid lightgray;
                      padding-top: 20px;
                      width: 80%;
                      margin: auto; /* Centering the h2 horizontally */
                      font-family: Cairo !important;
                  }
                  p {
                      text-align: start;
                      direction: rtl;
                      width: 80%;
                      margin: auto; /* Centering the paragraph horizontally */
                      font-family: Cairo !important;
                  }
                  a {
                      padding: 10px 20px;
                      width: max-content;
                      background-color: #3BB349;
                      color: white !important;
                      text-decoration-line: none !important;
                      border-radius: 6px;
                      margin: 20px aut !important;
                      align-self: center !important;
                      font-family: Cairo !important;
                  }
              </style>
          </head>
          <body>
              <div class="container">
                  <!-- // header -->
                  <div class="content">
                      <img src="https://i.postimg.cc/sXc5xdkM/Screenshot-2024-03-16-132803-removebg-preview.png" alt="">
                      <h2>تأكيد عنوان بريدك الإلكتروني</h2>
                      <p>
                          مرحبًا، 
                          <br>
                          <br>
                          يرجى تأكيد بريدك الإلكتروني عن طريق الضغط على الرابط التالي:
                          <br>
                          <br>
                      </p>
                      <p>
                      <a href="`+ process.env.ReactAppUrl + `student/check-email-link?code=`+ c_email_code + `&id=` + c_email_id + `">تأكيد بريدك الإلكتروني</a>
                      </p>
                      <p>
                          <br>
                          إذا لم تقم بطلب إنشاء حساب، يرجى تجاهل هذا البريد الإلكتروني.
                          <br>
                          <br>
                          شكرًا لك،
                          <br>
                          <br>
                          فريق الدعم الفني
                      </p>
                  </div>
              </div>
          </body>
          </html>
          
          `
        };

        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
              console.log(error);
              res.status(400).send({response: 'server_error', message: ''})
          } else {
              console.log('Email sent: ' + info.response);
              res.status(200).send({response: 'done'})
          }
        });
      }

      // console.log(errors)
    } catch (error) {
      console.log(error)
      res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
    }
}

module.exports.confirmEmail = async (req, res) => {
  try {
    if(req.body.code && req.body.id){
        // check id
        jwt.verify(req.body.id, process.env.mailHash, (err, decodedid) =>{
            if(err){
                res.status(200).send({response: 'failed'})
            }else{
                //check code
                jwt.verify(req.body.code, process.env.mailHash, async (err, decodedcode) =>{
                    if(err){
                        res.status(200).send({response: 'failed'})
                    }else{
                        const student = await Student.findOne({
                            where: {
                                email: decodedid.email
                            }
                        })
                        if(student){
                            if(student.random_email_code == null ){
                                student.random_email_code = ''
                            }
                            // check the code
                            const auth = await Bcrypt.compare(decodedcode.random_email_code, student.random_email_code)
                            if(auth){
                                // create token
                                const maxAge= 60*60*24*30
                                var token = jwt.sign({ id: student.id }, process.env.studentToken, { expiresIn: maxAge })

                                await student.update({
                                    verified: true,
                                    random_email_code: '',
                                })

                                // create cookies
                                res.cookie('student_token', token, {httpOnly: true, maxAge: maxAge * 1000})
                                res.status(200).send({response: 'done'})
                            }else{
                                res.status(200).send({response: 'failed', error: ''})
                            }
                        }else{
                            res.status(200).send({response: 'failed',})
                        }
                    }
                })
            }
        })
    }else{
        res.status(200).send({response: 'failed'})
    }
} catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}

module.exports.login = async (req, res) => {
  try {
    const {email, password} = req.body
    const student = await Student.findOne({
      where: {
        email
      }
    })
    if(student){
      const auth = await Bcrypt.compare(password, student.password)
      if(auth){
        //connected
          if(student.verified == true && student.banned == false){
            // allow access
            const maxAge= 60*60*24*30
            var token = jwt.sign({ id: student.id }, process.env.studentToken, { expiresIn: maxAge })
            console.log('connected')
            res.cookie('student_token', token, {httpOnly: true, maxAge: maxAge * 1000,
              //  sameSite: 'none', secure: true, path: '/student/*'
            })
            res.status(200).send({response: 'done'})
          }else if(student.verified == false && student.banned == false){
            // send a verification link
            
            var random = uuid.v4()
            const salte = await Bcrypt.genSalt();
            const hashed_email_code = await Bcrypt.hash(random, salte)

            await student.update({
              random_email_code: hashed_email_code,
            })

            var transporter = nodemailer.createTransport({
              // host: process.env.MailerHost,
              // port: process.env.MailerPort, // or your SMTP server's port number
              service: 'gmail',
              auth: {
                  user: process.env.MailerUser,
                  pass: process.env.MailerPass
              }
            });

            require.extensions['.html'] = function (module, filename) {
              module.exports = fs.readFileSync(filename, 'utf8');
            };
            const maxAge= 60*60*6
            var c_email_code = jwt.sign({ random_email_code: random }, process.env.mailHash, { expiresIn: maxAge })
            var c_email_id = jwt.sign({ email: email }, process.env.mailHash, { expiresIn: maxAge })

            

            var mailOptions = {
              from: '"Taraqi Academi" <' + process.env.MailerUser + '>',
              to: email,
              subject: 'تأكيد البريد الإلكتروني',
              html: `<!DOCTYPE html>
              <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Document</title>
                  <link rel="preconnect" href="https://fonts.googleapis.com">
                  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap" rel="stylesheet">
                  <style>
                      body {
                          font-family: Cairo !important;
                          width: 100%;
                          text-align: center; /* Aligning children to the center */
                      }
                      .container {
                          height: 100%;
                          width: 100%;
                          background-color: white;
                          display: flex;
                          justify-content: start !important;
                          align-items: center !important;
                          flex-direction: column !important; 
                      }
                      .content {
                          margin: 0px 20px;
                          max-width: 600px;
                          width: 100%;
                          background-color: white;
                          padding: 10px 20px;
                          border: 1px solid lightgray;
                          min-height: 400px;
                          border-radius: 20px;
                          display: block !important; 
                          flex-direction: column !important ;
                          justify-content: start !important ;
                          align-items: center  !important;
                      }
                      img {
                          width: 200px;
                          height: auto;
                          /* margin: auto; Centering the image horizontally Removed */
                          display: block;
                          margin-left: auto;
                          margin-right: auto;
                          align-self: center !important;
                      }
                      h2 {
                          text-align: right;
                          border-top: 1px solid lightgray;
                          padding-top: 20px;
                          width: 80%;
                          margin: auto; /* Centering the h2 horizontally */
                          font-family: Cairo !important;
                      }
                      p {
                          text-align: start;
                          direction: rtl;
                          width: 80%;
                          margin: auto; /* Centering the paragraph horizontally */
                          font-family: Cairo !important;
                      }
                      a {
                          padding: 10px 20px;
                          width: max-content;
                          background-color: #3BB349;
                          color: white !important;
                          text-decoration-line: none !important;
                          border-radius: 6px;
                          margin: 20px aut !important;
                          align-self: center !important;
                          font-family: Cairo !important;
                      }
                  </style>
              </head>
              <body>
                  <div class="container">
                      <!-- // header -->
                      <div class="content">
                          <img src="https://i.postimg.cc/sXc5xdkM/Screenshot-2024-03-16-132803-removebg-preview.png" alt="">
                          <h2>تأكيد عنوان بريدك الإلكتروني</h2>
                          <p>
                              مرحبًا، 
                              <br>
                              <br>
                              يرجى تأكيد بريدك الإلكتروني عن طريق الضغط على الرابط التالي:
                              <br>
                              <br>
                          </p>
                          <p>
                          <a href="`+ process.env.ReactAppUrl + `student/check-email-link?code=`+ c_email_code + `&id=` + c_email_id + `">تأكيد بريدك الإلكتروني</a>
                          </p>
                          <p>
                              <br>
                              إذا لم تقم بطلب إنشاء حساب، يرجى تجاهل هذا البريد الإلكتروني.
                              <br>
                              <br>
                              شكرًا لك،
                              <br>
                              <br>
                              فريق الدعم الفني
                          </p>
                      </div>
                  </div>
              </body>
              </html>
              
              `
            };

            transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                  console.log(error);
                  res.status(400).send({response: 'server_error', message: ''})
              } else {
                  console.log('Email sent: ' + info.response);
                  res.status(200).send({response: 'info', message: `لقد أرسلنا لك رسالة تأكيد بالبريد الإلكتروني على ${email}،   تحقق من بريدك الإلكتروني لتتمكن من الوصول إلى حسابك.`})
              }
            });
          }else{
            res.status(400).send({response: 'student_banned', message: 'لا يمكنك الوصول إلى حسابك، لقد تم حظرك من قبل مسؤول المنصة' })
          }
      }else{
        res.status(400).send({response: 'server_error', message: 'البريد الإلكتروني أو كلمة المرور خاطئة'})
      }
    }else{
      res.status(400).send({response: 'server_error', message: 'البريد الإلكتروني أو كلمة المرور خاطئة'})
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}

module.exports.resetPassword = async (req, res) => {
  try {
    const email = req.body.email
    if(validator.isEmail(email)){
      const student = await Student.findOne({
        where:{
          email
        }
      })
      if(student){
        // send reset email
            var random = uuid.v4()
            const salte = await Bcrypt.genSalt();
            const hashed_password_code = await Bcrypt.hash(random, salte)

            await student.update({
              random_pass_code: hashed_password_code,
            })

            var transporter = nodemailer.createTransport({
              // host: process.env.MailerHost,
              // port: process.env.MailerPort, // or your SMTP server's port number
              service: 'gmail',
              auth: {
                  user: process.env.MailerUser,
                  pass: process.env.MailerPass
              }
            });

            require.extensions['.html'] = function (module, filename) {
              module.exports = fs.readFileSync(filename, 'utf8');
            };
            const maxAge= 60*60*6
            var c_pass_code = jwt.sign({ random_pass_code: random }, process.env.mailHash, { expiresIn: maxAge })
            var c_email_id = jwt.sign({ email: email }, process.env.mailHash, { expiresIn: maxAge })

            

            var mailOptions = {
              from: '"Taraqi Academi" <' + process.env.MailerUser + '>',
              to: email,
              subject: 'إعادة تعيين كلمة المرور',
              html: `<!DOCTYPE html>
              <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Document</title>
                  <link rel="preconnect" href="https://fonts.googleapis.com">
                  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap" rel="stylesheet">
                  <style>
                      body {
                          font-family: Cairo !important;
                          width: 100%;
                          text-align: center; /* Aligning children to the center */
                      }
                      .container {
                          height: 100%;
                          width: 100%;
                          background-color: white;
                          display: flex;
                          justify-content: start !important;
                          align-items: center !important;
                          flex-direction: column !important; 
                      }
                      .content {
                          margin: 0px 20px;
                          max-width: 600px;
                          width: 100%;
                          background-color: white;
                          padding: 10px 20px;
                          border: 1px solid lightgray;
                          min-height: 400px;
                          border-radius: 20px;
                          display: block !important; 
                          flex-direction: column !important ;
                          justify-content: start !important ;
                          align-items: center  !important;
                      }
                      img {
                          width: 200px;
                          height: auto;
                          /* margin: auto; Centering the image horizontally Removed */
                          display: block;
                          margin-left: auto;
                          margin-right: auto;
                          align-self: center !important;
                      }
                      h2 {
                          text-align: right;
                          border-top: 1px solid lightgray;
                          padding-top: 20px;
                          width: 80%;
                          margin: auto; /* Centering the h2 horizontally */
                          font-family: Cairo !important;
                      }
                      p {
                          text-align: start;
                          direction: rtl;
                          width: 80%;
                          margin: auto; /* Centering the paragraph horizontally */
                          font-family: Cairo !important;
                      }
                      a {
                          padding: 10px 20px;
                          width: max-content;
                          background-color: #3BB349;
                          color: white !important;
                          text-decoration-line: none !important;
                          border-radius: 6px;
                          margin: 20px aut !important;
                          align-self: center !important;
                          font-family: Cairo !important;
                      }
                  </style>
              </head>
              <body>
                  <div class="container">
                      <!-- // header -->
                      <div class="content">
                          <img src="https://i.postimg.cc/sXc5xdkM/Screenshot-2024-03-16-132803-removebg-preview.png" alt="">
                          <h2>إعادة تعيين كلمة المرور</h2>
                          <p>
                              مرحبًا، 
                              <br>
                              <br>
                              يمكنك إعادة تعيين كلمة المرور عن طريق الضغط على الرابط التالي:
                              <br>
                              <br>
                          </p>
                          <p>
                          <a href="`+ process.env.ReactAppUrl + `student/resetPassword?code=`+ c_pass_code + `&id=` + c_email_id + `">إعادة تعيين كلمة المرور</a>
                          </p>
                          <p>
                              <br>
                              إذا لم تقم بطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.
                              <br>
                              <br>
                              شكرًا لك،
                              <br>
                              <br>
                              فريق الدعم الفني
                          </p>
                      </div>
                  </div>
              </body>
              </html>
              
              `
            };

            transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                  console.log(error);
                  res.status(400).send({response: 'server_error', message: ''})
              } else {
                  console.log('Email sent: ' + info.response);
                  res.status(200).send({response: 'info', message: `لقد أرسلنا لك رسالة إعادة تعيين كلمة المرور على ${email}،   تحقق من بريدك الإلكتروني لتتمكن من الوصول إلى حسابك.`})
              }
            });
          
      }else{
        res.status(400).send({response: 'invalid_params', message: 'لا يوجد أي حساب بهذا البريد الإلكتروني'})
      }
    }else{
      res.status(400).send({response: 'invalid_params', message: 'يرجى إدخال بريد إلكتروني صالح'})
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}

module.exports.checkResetPassword = async (req, res) => {
  try {
    const {type, password, confirmPassword} = req.body
    if(req.body.code && req.body.id){
        // check id
        jwt.verify(req.body.id, process.env.mailHash, (err, decodedid) =>{
            if(err){
                res.status(200).send({response: 'failed'})
            }else{
                //check code
                jwt.verify(req.body.code, process.env.mailHash, async (err, decodedcode) =>{
                    if(err){
                        res.status(200).send({response: 'failed'})
                    }else{
                        const student = await Student.findOne({
                            where: {
                                email: decodedid.email
                            }
                        })
                        if(student){
                            if(student.random_pass_code == null ){
                                student.random_pass_code = ''
                            }
                            // check the code
                            const auth = await Bcrypt.compare(decodedcode.random_pass_code, student.random_pass_code)
                            if(auth){
                                // create token
                                if(type == 'reset'){
                                    const errors = []
                                    if(password){
                                      if(password.length < 8){
                                        errors.push({field: 'password', message: 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل'})
                                      }
                                    }else{
                                      errors.push({field: 'password', message: 'كلمة المرور مطلوبة'})
                                    }

                                    if(confirmPassword){
                                      if(confirmPassword != password){
                                        errors.push({field: 'confirmPassword', message: 'كلمة المرور وتأكيد كلمة المرور ليستا متماثلتين'})
                                      }
                                    }else{
                                      errors.push({field: 'confirmPassword', message: 'تأكيد كلمة المرور مطلوبة'})
                                    }

                                    if(errors.length > 0 ){
                                      res.status(400).send({response: 'invalid_params', message: 'تحقق من صحة بياناتك', errors})
                                    }else{
                                      const salte = await Bcrypt.genSalt()
                                      const hashed_password = await Bcrypt.hash(password, salte)
                                      console.log(hashed_password)
                                      await student.update({
                                          password: hashed_password,
                                          random_pass_code: '',
                                      })
  
                                      res.cookie('student_token', '', {httpOnly: true, maxAge: 1})
                                      res.status(200).send({response: 'done'})
                                    }

                                   
                                }else{
                                  res.status(200).send({response: 'checked'})
                                }
                            }else{
                                res.status(200).send({response: 'failed', error: ''})
                            }
                        }else{
                            res.status(200).send({response: 'failed',})
                        }
                    }
                })
            }
        })
    }else{
        res.status(200).send({response: 'failed'})
    }
} catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}


module.exports.logout = async (req, res) => {
  try {
    res.cookie('student_token', '', {httpOnly: true, maxAge: 1})
    res.status(200).send({response: 'done'})
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}

module.exports.getProfileData = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: {
        id: req.id
      },
      attributes: ['firstName', 'familyName', 'email', 'description', 'phoneNumber', 'country', 'wilaya', 'image', 'birthDate', 'gender', 'hizbCount', 'studyLevel', 'status']
    })
    if(student){
      res.status(200).send({response: 'done', student})
    }else{
      res.status(400).send({response: 'not_found', message: 'بيانات هذا الطالب غير موجودة'})
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}


module.exports.uploadPhoto = async (req, res) => {
  try {
    if(req.file){
        if(req.file.mimetype.startsWith('image/')){
            const folderPath = Path.join(__dirname, '/../images');
            if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
                console.log('Folder created');
            } else {
                console.log('Folder already exists');
            }
            const timestamp = Date.now();
            const min = 9999999999;
            const max = 9999999999999;
            const random = Math.floor(Math.random() * (max - min + 1)) + min;
            const fileName = `image_${timestamp}${random}`;
            fs.renameSync( Path.join(__dirname, `../` + req.file.destination + `/` + req.file.filename), Path.join(__dirname, `../images/`  + fileName + `.` + req.file.mimetype.split('/')[1]))
            console.log('/pics/' + fileName + `.` + req.file.mimetype.split('/')[1])
            res.status(200).send({response: 'done', image:  process.env.NodeAppUrl + 'studentApi/pics/' + fileName + `.` + req.file.mimetype.split('/')[1] })
        
        }else{
            const filePath = Path.join(__dirname, '/../imported/'+ req.file.filename );
            // delete the file
            fs.unlink(filePath, (err) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(`File ${filePath} has been deleted`);
            });
            res.status(400).send({response: 'server_error', message: 'يُسمح بالصور فقط'})
        }
    }else{
      res.status(400).send({response: 'server_error', message: 'لم يتم العثور على أي صورة'})
    }
          
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}

function getImageContentType(imageName) {
  const ext = Path.extname(imageName).toLowerCase();
  switch (ext) {
      case '.png':
          return 'image/png';
      case '.jpg':
      case '.jpeg':
          return 'image/jpeg';
      case '.gif':
          return 'image/gif';
      // Add more cases as needed for other image formats
      default:
          return 'application/octet-stream';
  }
}

module.exports.getImage = async (req, res) => {
  try {
      const folderPath = Path.join(__dirname, './../images');
      console.log(folderPath)
      const imageName = req.params.image;
      const imagePath = Path.join(folderPath, imageName);

      // Check if the file exists
      if (fs.existsSync(imagePath)) {
          // Set the appropriate content type based on the file extension
          const contentType = getImageContentType(imageName);
          res.setHeader('Content-Type', contentType);

          // Read the image file and send it in the response
          const imageStream = fs.createReadStream(imagePath);
          imageStream.pipe(res);
      } else {
          // If the image doesn't exist, send a 404 response
          res.status(400).send({response: 'server_error', message: 'لم يتم العثور على أي صورة'})
      } 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
 
}


module.exports.saveProfileChanges = async (req, res) => {
  try {
    const { firstName, familyName, phoneNumber, birthDate, country, wilaya, gender, studyLevel, status, hizbCount, description, image } = req.body
    // validation 
    const errors = []

    if(validator.isDate(birthDate)){
      const birthdate = new Date(birthDate);
      const currentDate = new Date();
      const age = currentDate.getFullYear() - birthdate.getFullYear();
      if(age >= 10){
        // everything is good here
      }else{
        errors.push({field: 'birthDate', message: 'العمر يجب أن يكون أكبر من 10 سنوات'})
      }
    }else{
      errors.push({field: 'birthDate', message: 'تاريخ الميلاد مطلوب'})
    }

    if(phoneNumber & phoneNumber.length > 0){
      if(country == 'الجزائر'){
        if(phone('+213' + phoneNumber).isValid){
          // good
        }else{
          errors.push({field: 'phoneNumber', message: 'أدخل رقم هاتف صالح فقط'})
        }
      }else{
        if(phoneNumber.length < 10){
          errors.push({field: 'phoneNumber', message: 'أدخل رقم هاتف صالح فقط'})
        }
      }
    }else{
      errors.push({field: 'phoneNumber', message: 'رقم الهاتف مطلوب'})
    }

    if(firstName && firstName.length < 3){
      errors.push({field: 'firstName', message: 'يجب أن يحتوي الاسم على أكثر من حرفين'})
    }else if(firstName && firstName.length > 100){
      errors.push({field: 'firstName', message: 'يجب ألا يحتوي الاسم على أكثر من 100 حرف'})
    }else if(firstName.length > 3 && firstName.length < 100){
      // good
    } else{
      errors.push({field: 'firstName', message: 'الاسم مطلوب'})
    }

    if(familyName && familyName.length < 3){
      errors.push({field: 'familyName', message: 'يجب أن يحتوي اللقب على أكثر من حرفين'})
    }else if(familyName && familyName.length > 100){
      errors.push({field: 'familyName', message: 'يجب ألا يحتوي اللقب على أكثر من 100 حرف'})
    }else if(familyName.length > 3 && familyName.length < 100){
      // good
    }else{
      errors.push({field: 'familyName', message: 'اللقب مطلوب'})
    }


    if(country){
      if(country.length < 3){
        errors.push({field: 'country', message: 'يجب أن يحتوي البلد على أكثر من حرفين'})
      }else if(country.length > 100){
        errors.push({field: 'country', message: 'يجب ألا يحتوي البلد على أكثر من 100 حرف'})
      }else{
        // good
      }
    }else{
      errors.push({field: 'country', message: 'البلد مطلوب'})
    }

    if(wilaya){
      if(wilaya.length < 2){
        errors.push({field: 'wilaya', message: 'يجب أن تحتوي الولاية على أكثر من حرفين'})
      }else if (wilaya.length > 100){
        errors.push({field: 'wilaya', message: 'يجب ألا تحتوي الولاية على أكثر من 100 حرف'})
      }else{
        // good
      }
    }else{
      errors.push({field: 'wilaya', message: 'الولاية مطلوبة'})
    }

    if(gender && gender.length > 0){
      if(gender == 'أنثى' || gender == 'ذكر'){
        // true
      }else{
        errors.push({field: 'gender', message: 'اختر واحدًا من الخيارات المتاحة'})
      }
    }

    if(studyLevel && studyLevel.length > 0){
      if(studyLevel == 'المرحلة المتوسطة' || studyLevel == 'المرحلة الثانوية' || studyLevel == 'المرحلة الجامعية'){
        // true
      }else{
        errors.push({field: 'studyLevel', message: 'اختر واحدًا من الخيارات المتاحة'})
      }
    }

    if(status && status.length > 0){
      if(status == 'طالب' || status == 'عامل' || status == 'عاطل عن العمل'){
        // true
      }else{
        errors.push({field: 'status', message: 'اختر واحدًا من الخيارات المتاحة'})
      }
    }

    if(hizbCount && hizbCount.length > 0){
      if(hizbCount <= 60 && hizbCount >= 0){
        // true
      }else{
        errors.push({field: 'hizbCount', message: 'اختر واحدًا من الخيارات المتاحة'})
      }
    }

    if(description && description.length > 300){
        errors.push({field: 'description', message: 'يجب ألا يحتوي الوصف على أكثر من 300 حرف'})
    }

    if(errors.length > 0){
      res.status(400).send({response: 'invalid_params', errors, message: 'بيانات غير صالحة، تحقق منها مرة أخرى'})
    }else{
      await Student.update({
        firstName, familyName, phoneNumber, birthDate, country, wilaya, gender, studyLevel, status, hizbCount, description, image
      },{
        where:{
          id: req.id
        }
      })
      res.status(200).send({response: 'done', message: 'تم حفظ التغييرات بنجاح'})
    }


  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}

module.exports.savePassword = async (req, res) => {
  try {
    const {currentPassword, password, confirmPassword} = req.body
    const student = await Student.findOne({
      where: {
        id: req.id
      }
    })

    if(student){
      const auth = await Bcrypt.compare(currentPassword, student.password)
      if(auth){
        if(password.length > 7){
          if(password == confirmPassword){
            const salte = await Bcrypt.genSalt()
            const hashed_password = await Bcrypt.hash(password, salte)
            await student.update({
              password: hashed_password
            })
            res.status(200).send({response: 'done',  message: 'تم حفظ كلمة المرور الجديدة'})

          }else{
            res.status(400).send({response: 'invalid_params', errors: [{field: 'confirmPassword', message: 'تأكيد كلمة المرور لا يتطابق مع كلمة المرور'}],  message: ' تحقق من بياناتك وحاول مرة أخرى'})
          }
        }else{
          res.status(400).send({response: 'invalid_params', errors: [{field: 'password', message: 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل'}],  message: ' تحقق من بياناتك وحاول مرة أخرى'})
        }
      }else{
        res.status(400).send({ response: 'invalid_params', errors: [{field: 'currentPassword', message: 'كلمة المرور الحالية خاطئة'}],  message: ' تحقق من بياناتك وحاول مرة أخرى'})
      }
    }else{
      res.status(400).send({response: 'server_error', message: 'لم يتم العثور على هذا المستخدم، حاول مرة أخرى لاحقاً'})
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}

module.exports.saveNotifChanges = async (req, res) => {
  try {
    const {examNotif, subsNotif, resultNotif} = req.body
    if((examNotif == true || examNotif == false) && (subsNotif == true || subsNotif == false) && (resultNotif == true || resultNotif == false)){
      await Notification.update({
        examNotification: examNotif,
        subscriptionNotification: subsNotif,
        resultNotification: resultNotif
      }, {
        where:{
          studentId: req.id
        }
      })
      res.status(200).send({response: 'done', message: 'تم حفظ إعداد الإشعارات'})

    }else{
      res.status(400).send({response: 'server_error', message: 'بيانات خاطئة، تحقق منها وحاول مرة أخرى'})
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}

module.exports.getNotifications = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        studentId: req.id
      },
      attributes: ['resultNotification', 'subscriptionNotification', 'examNotification']
    })
    if(notification){
      console.log(notification)
      res.status(200).send({response: 'done', notification })
    }else{
      res.status(400).send({response: 'server_error', message: 'لم يتم العثور على إشعارات هذا الطالب'})
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}


module.exports.getPrograms = async (req, res) => {
  try {
    const programs = await StudyProgram.findAll()
    const studentProgram = await studentStudyProgram.findOne({
      where: {
        studentId : req.id,
        status: 'start'
      },
      attributes:['studyProgramId']
    })
    const CurrentProgram = await studentStudyProgram.findOne({
      where: {
        studentId : req.id,
        status: 'start'
      },
      attributes:['studyProgramId']
    })
    res.status(200).send({response: 'done', programs, studentProgram, programRegistration: CurrentProgram ? true : false })
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}

module.exports.getProgram = async (req, res) => {
  try {
    const id = req.body.id
    console.log(req.body)
    
    const program = await StudyProgram.findOne({where: {id}})
    const studentProgram = await studentStudyProgram.findOne({
      where: {
        studentId : req.id,
        studyProgramId: id,
        status: 'start'
      },
      attributes:['studyProgramId']
    })

    const CurrentProgram = await studentStudyProgram.findOne({
      where: {
        studentId : req.id,
        status: 'start'
      },
      attributes:['studyProgramId']
    })
    res.status(200).send({response: 'done', program, choosed: studentProgram ? true : false, programRegistration: CurrentProgram ? true : false })
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}

module.exports.programRegistration = async (req, res) => {
  try {
    const programId = req.body.programId
    const studentProgram = await studentStudyProgram.findOne({
      where: {
        studentId: req.id,
        status: 'start'
      }
    })

    if(studentProgram){
      res.status(400).send({response: 'server_error', message: 'سبق لك التسجيل في برنامج آخر' })
    }else{
      const programExist = await StudyProgram.findOne({
        where:{
          id: programId
        }
      })
      if(programExist){
        if(programExist.status == 'available'){
          const currentDate = Date.now()
          await studentStudyProgram.create({
            level: 0,
            status: 'start',
            studentId: req.id,
            studyProgramId: programId,
            experationDate: currentDate
          })
          res.status(200).send({response: 'done', message: 'تم تسجيلك في البرنامج بنجاح' })
        }else{
          res.status(400).send({response: 'server_error', message: 'البرنامج غير متاح حالياً' })
        }
      }else{
        res.status(400).send({response: 'server_error', message: 'البرنامج غير موجود' })
      }
    }
    
    // res.status(200).send({response: 'done', program, choosed: studentProgram ? true : false })
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}

module.exports.getSubscriptions = async (req, res) => {
  try {
    const programs = await studentStudyProgram.findAll({
      where: {
        studentId: req.id,
      }
    })

    if(programs.length > 0){
      const program = await studentStudyProgram.findOne({
        where: {
          studentId: req.id,
          status: 'start'
        }
      })
      if(program){
        if(program.level == 0){
          const subscriptions = await Subscription.findAll({
            where:{
              studentId: req.id
            },
            order: [['createdAt', 'DESC']]
          })
          res.status(200).send({response: 'paySubscription', subscriptions})
        }else{
          var currentDate = new Date();
          var givenDate = new Date(program.experationDate);
          var startMs = currentDate.getTime();
          var endMs = givenDate.getTime();
          var differenceMs = endMs - startMs;
          var differenceDays = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
          const subscriptions = await Subscription.findAll({
            where:{
              studentId: req.id
            },
            order: [['createdAt', 'DESC']]
          })
          res.status(200).send({response: 'done', expirationDays: differenceDays, subscriptions })
        }
      }else{
        const subscriptions = await Subscription.findAll({
        where:{
          studentId: req.id
        },
        order: [['createdAt', 'DESC']]
      })
        res.status(200).send({response: 'selectNewProgram', subscriptions})
      }
    }else{
      const subscriptions = await Subscription.findAll({
        where:{
          studentId: req.id
        },
        order: [['createdAt', 'DESC']]
      })
      res.status(200).send({response: 'noProgram', subscriptions})
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}


module.exports.getPaymentDetails = async (req, res) => {
  try {
    const program = await studentStudyProgram.findOne({
      studentId: req.id,
      status: 'start'
    })
    if(program){
      const studyProgram = await StudyProgram.findOne({
        where: {
          id: program.studyProgramId
        }
      })
      res.status(200).send({response: 'done', program: studyProgram, studentProgram: program}) 
    }else{
      res.status(200).send({response: 'noProgram', program}) 
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.addSubscription = async (req, res) => {
  try {
    const program = await studentStudyProgram.findOne({
      studentId: req.id,
      status: 'start'
    })
    if(program){
      const studyProgram = await StudyProgram.findOne({
        where: {
          id: program.studyProgramId
        }
      })
      const type = req.body.subscriptionType
      if(type && (type == 1 || type == 3 || type == 6 || type == 12)){
        var price = type * studyProgram.price
        var experationDate = new Date(program.experationDate);
        experationDate.setMonth(experationDate.getMonth() + type);
        experationDate.toDateString()
        await Subscription.create({
            validationDate: program.experationDate,
            expirationDate: experationDate,
            type,
            status: 'notPayed',
            amount: price,
            program: studyProgram.name,
            studentId: req.id
        })
        res.status(200).send({response: 'done', message: 'تم إضافة اشتراكك، سيتم تفعيل اشتراكك بعد تأكيد الدفع.'}) 
      }else{
        res.status(400).send({response: 'server_error', message: 'تحقق من نوع الاشتراك'}) 
      }
    }else{
      res.status(400).send({response: 'server_error', message: 'لم يتم تحديد أي برنامج'}) 
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}

// to be deleted
module.exports.addDemoData = async (req, res) => {
  try {
    const exams = [
      {
        name: 'الامتحان الأول 2024',
        questions: [
          {
            question: 'first question',
            answers: [
              {
                place: 1,
                isCorrect: true,
                content: 'الإجابة الأولى للسؤال الأول'
              },
              {
                place: 2,
                isCorrect: false,
                content: 'الإجابة الثانية للسؤال الأول'
              },
              {
                place: 3,
                isCorrect: false,
                content: 'الإجابة الثالثة للسؤال الأول'
              }
            ]
          },
          {
            question: 'second question',
            answers: [
              {
                place: 1,
                isCorrect: false,
                content: 'الإجابة الأولى للسؤال الثانية'
              },
              {
                place: 2,
                isCorrect: true,
                content: 'الإجابة الثانية للسؤال الثانية'
              },
              {
                place: 3,
                isCorrect: false,
                content: 'الإجابة الثالثة للسؤال الثانية'
              }
            ]
          }
        ] 
      }
    ]

    for (let i = 0; i < exams.length; i++) {
      const exam = exams[i];
      const dbExam = await Exam.create({
        name: exam.name
      })

      for (let j = 0; j < exam.questions.length; j++) {
        const question = exam.questions[j];
        const dbQuestion = await Question.create({
          examId: dbExam.id,
          place: j + 1,
          note: 2,
          content: question.question
        })
        for (let s = 0; s < question.answers.length; s++) {
          const answer = question.answers[s];
          await Answer.create({
            questionId: dbQuestion.id,
            place: answer.place,
            isCorrect: answer.isCorrect,
            content: answer.content
          })
        }
      }
      
    }


    const programs = [
      {
        name: 'برنامج الهمم',
        description: 'برنامج لحفظ القرآن الكريم كاملا مع التجويد  بالاضافة لحفظ الغريب و قراءة التفسير المختصر له في مدة ثلاث سنوات.        ',
        age: '13 سنة فما فوق',
        duration: '3 سنوات',
        studyDuration: '30 شهرا ( 10 أشهر كل سنة)',
        vacationDuration: '6 أشهر ( شهرين كل سنة)',
        levels: '7 مستويات',
        price: '5000',
        status: 'notAvailable'
      },
      {
        name: 'برنامج النور',
        description: 'برنامج لحفظ سورة النور في أسبوعين',
        age: '13 سنة فما فوق',
        duration: '2 أسبوع',
        studyDuration: '30 شهرا ( 10 أشهر كل سنة)',
        vacationDuration: '6 أشهر ( شهرين كل سنة)',
        levels: '7 مستويات',
        price: '1000',
        status: 'available'
      },
    ]

    for (let i = 0; i < programs.length; i++) {
      const program = programs[i];
      console.log(program)
      await StudyProgram.create(
        program
      )
    }

    res.status(200).send({done: true})
  } catch (error) {
    console.log(error)
    res.send(error)
  }
}



module.exports.getDemoData = async (req, res) => {
  try {
    
    const exams = await Exam.findAll({
      include: [{ model: Question, as: 'questions', include: [{ model: Answer, as: 'answers' }] }]
    })

    const studyPrograms = await StudyProgram.findAll()

    res.status(200).send({done: true, exams, studyPrograms})
  } catch (error) {
    console.log(error)
    res.send(error)
  }
}

module.exports.getExams = async (req, res) => {
  try {
    const myStudent = await student.findOne({
      where:{
        id: req.id
      },
      include: [{ model: exam, through: StudentExam }]
    })
    var myStudentExams = []

    if(myStudent && myStudent.exams){
      for (let i = 0; i < myStudent.exams.length; i++) {
        const exam = myStudent.exams[i];
        const studentExam = await StudentExam.findOne({
          where:{
            examId: exam.id,
            studentId: req.id
          }
        })
        if(studentExam){
          var currentDate = new Date();
          var differenceMs = currentDate - studentExam.createdAt;
          // Convert milliseconds to minutes
          var differenceMinutes = Math.floor(differenceMs / (1000 * 60));
          if(studentExam.status == 'finish' || differenceMinutes > exam.time ){
            myStudentExams.push({id: studentExam.id, title: exam.title, totalNote: exam.note, startExam: exam.startExam, endExam: exam.endExam, date: studentExam.createdAt, note: studentExam.noteStatus == 'corrected' ? studentExam.note : '--', answers: studentExam.answers, status: studentExam.status, type: exam.type})
          }
        }
      }
    }

    const studentGroup = await StudentGroup.findOne({
      where:{
        studentId : req.id
      }
    })
    var exams = []
    if(studentGroup){
      exams = await Exam.findAll({
        where: {
          endExam: {
            [Op.gt]: new Date() // Using Sequelize's greater than operator
          }
        },
        include: [{
          model: Group,
          where: {
            id: studentGroup.groupId // Filter exams by the group ID
          },
          through: 'GroupExam' // Assuming your through model is named GroupExam
        }]
      });
    }
    var data = []
    for (let i = 0; i < exams.length; i++) {
      const examItem = exams[i];
      const exist = await StudentExam.findOne({
        where:{
          studentId: req.id,
          examId: examItem.id
        }
      })
      if(exist){
        if(exist.status && exist.status == 'start'){
          data.push({id: examItem.id, title: examItem.title, description: examItem.description, startExam: examItem.startExam, endExam: examItem.endExam, time: examItem.time, type: examItem.type, status: 'started' })
        }
      }else{
        data.push({id: examItem.id, title: examItem.title, description: examItem.description, startExam: examItem.startExam, endExam: examItem.endExam, time: examItem.time, type: examItem.type, status: 'notStarted' })
      }
    }
    res.status(200).send({response: 'done', studentExams: myStudentExams, exams: data}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}

module.exports.enterExam = async (req, res) => {
  try {
    console.log(req.body)
    const examId = req.body.examId
    const exam = await Exam.findOne({
      where:{
        id: examId
      }
    })
    if(exam){
      console.log('exam found')
      const studentExam = await StudentExam.findOne({
        where:{
          examId: examId,
          studentId: req.id
        }
      })
      if(studentExam){
        if(studentExam.status == 'finish'){
          // cannot access
          res.status(200).send({response: 'not-allowed', message: 'تم إجراء هذا الامتحان '}) 

        }else{
          var currentDate = new Date()
          console.log(exam.endExam)
          console.log(currentDate)
          if(currentDate < new Date(exam.endExam)){
            var differenceMs = currentDate - studentExam.createdAt;
            // Convert milliseconds to minutes
            var differenceMinutes = Math.floor(differenceMs / (1000 * 60));
            if(differenceMinutes < exam.time){
              // access
              res.status(200).send({response: 'done', exam: exam.id}) 
            }else{
              // cannot access time end
              res.status(200).send({response: 'not-allowed', message: 'انتهى الوقت المسموح به للامتحان'}) 
            }
          }else{
            // cannot access exam date end
            res.status(200).send({response: 'not-allowed', message: 'انتهى التاريخ المسموح به للامتحان'}) 
          }
        }
      }else{

        var currentDate = new Date()
        if(currentDate < new Date(exam.startExam)){
          // cannot access not availble yet
          res.status(200).send({response: 'not-allowed', message: 'الامتحان غير متاح الآن'}) 

        }else{
          if(currentDate > new Date(exam.endExam)){
            // cannot access too late
            res.status(200).send({response: 'not-allowed', message: 'انتهى التاريخ المسموح به للامتحان'}) 

          }else{
            var data = []
            var questions = exam.questions ? JSON.parse(exam.questions) : [] 
            for (let i = 0; i < questions.length; i++) {
              const question = questions[i];
              for (let j = 0; j < question.options.length; j++) {
                const option = question.options[j];
                question.options[j].answer = false
              }
              if(question.type == 'text'){
                data.push({question: question.question, type: question.type, answer: '', point: question.point, note: '--' })
              }else{
                data.push({question: question.question, type: question.type, options: question.options, point: question.point, note: '0' })
              }
            }

            const newStudentExam = await StudentExam.create({
              status : 'start',
              note: '',
              noteStatus: 'notCorrected',
              answers: JSON.stringify(data),
              studentId: req.id,
              examId
            })
            res.status(200).send({response: 'done', exam: exam.id}) 
          }
        }
      }
    }else{
      // there is no exam
      res.status(200).send({response: 'not-allowed', message: 'لا يوجد امتحان '}) 
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}

module.exports.getExam = async (req, res) => {
  try {
    console.log(req.body)
    const examId = req.body.examId
    const exam = await Exam.findOne({
      where:{
        id: examId
      },
    })
    if(exam){
      console.log('exam found')
      console.log()
      const studentExam = await StudentExam.findOne({
        where:{
          examId: examId,
          studentId: req.id
        }
      })
      if(studentExam){
        if(studentExam.status == 'finish'){
          // cannot access
          res.status(200).send({response: 'not-allowed', message: 'تم إجراء هذا الامتحان '}) 
        }else{
          var currentDate = new Date()
          if(currentDate < new Date(exam.endExam)){
            var differenceMs = currentDate - studentExam.createdAt;
            // Convert milliseconds to minutes
            var differenceMinutes = Math.floor(differenceMs / (1000 * 60));
            console.log(currentDate)
            console.log(exam.createdAt)
            console.log(differenceMs)
            console.log(differenceMinutes)

            if(differenceMinutes < exam.time){
              // access
              const myExam = await Exam.findOne({
                where:{
                  id: examId
                },
                attributes:['id','title','description','startExam','endExam','time','type','note','instructions']
              })
              res.status(200).send({response: 'done', exam: studentExam, examInfo: myExam}) 
            }else{
              // cannot access time end
              res.status(200).send({response: 'not-allowed', message: 'انتهى الوقت المسموح به للامتحان'}) 
            }
          }else{
            // cannot access exam date end
            res.status(200).send({response: 'not-allowed', message: 'انتهى التاريخ المسموح به للامتحان'}) 
          }
        }
      }else{
          res.status(200).send({response: 'not-allowed', message: 'لا يوجد امتحان '})   
      }
    }else{
      // there is no exam
      res.status(200).send({response: 'not-allowed', message: 'لا يوجد امتحان '}) 
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}

module.exports.saveExam = async (req, res) => {
  try {
    console.log(req.body)
    const {studentExamId, answers} = req.body
    const studentExam = await StudentExam.findOne({
      where:{
        id: studentExamId
      }
    })
    if(studentExam){
      //console.log(studentExam)
      const exam = await Exam.findOne({
        where: {
          id: studentExam.examId
        }
      })
      if(exam){
        // console.log(exam)
        var data = exam.questions && exam.questions.length > 0 ? JSON.parse(exam.questions) : []
        var examNoteStatus = 'corrected'
        var examNote = 0
        console.log('data : ' , data )
        for (let i = 0; i < data.length; i++) {
          const question = data[i];
          if(question.type == 'options'){
            var note = 0
            var selection = 0
            if(answers[i]){
              for (let j = 0; j < answers[i].options.length; j++) {
                const answer = answers[i].options[j];
                if(answer.answer == question.options[j].answer && question.options[j].answer == true ){
                  note = note + Number(question.point)
                }
              }
            }
            if(note > 0){
              examNote = examNote + note 
              answers[i].note = note
            }

          }else{
            examNoteStatus = 'notCorrected'
          }
        }
        await studentExam.update({
          answers: JSON.stringify(answers),
          status: 'finish',
          note: examNote,
          noteStatus: examNoteStatus
        })
        res.status(200).send({response: 'done', message: 'تم حفظ الامتحان '}) 
      }else{
        res.status(400).send({response: 'server_error', message: 'الامتحان غير موجود'}) 
      }
    }else{
      res.status(400).send({response: 'server_error', message: 'الامتحان غير موجود'}) 
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.preBuild = async (req, res) => {
  try {
    res.status(200).send({response: 'done'}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}