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
const Admin = require('../models/admin')
const Notification = require('../models/notifications')
// const Answer = require('../models/answer')
const Exam = require('../models/exam')
const Group = require('../models/group')
// const Question = require('../models/question')
const StudyProgram = require('../models/studyProgram')
const Teacher = require('../models/teacher');
const studentStudyProgram = require('../models/studentStudyProgram');
const Subscription = require('../models/subscription');
const StudentGroup = require('../models/StudentGroup');
const Report = require('../models/reports');
const TeacherNotifications = require('../models/teacherNotifications');
const StudentExam = require('../models/StudentExam');
const groupExam = require('../models/groupExam');
const adminNotifications = require('../models/adminNotifications');
const platform = require('../models/platform');



module.exports.checkLogin = async (req, res) => {
  try {
    
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
                        const admin = await Admin.findOne({
                            where: {
                                email: decodedid.email
                            }
                        })
                        if(admin){
                            if(admin.random_email_code == null ){
                                admin.random_email_code = ''
                            }
                            // check the code
                            const auth = await Bcrypt.compare(decodedcode.random_email_code, admin.random_email_code)
                            if(auth){
                                // create token
                                const maxAge= 60*60*24*30
                                var token = jwt.sign({ id: admin.id }, process.env.adminToken, { expiresIn: maxAge })

                                await admin.update({
                                    verified: true,
                                    random_email_code: '',
                                })

                                // create cookies
                                res.cookie('admin_token', token, {httpOnly: true, maxAge: maxAge * 1000})
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
    const admins = await Admin.findAll()
    if(admins.length > 0){
      // login
      const admin = await Admin.findOne({
        where: {
          email
        }
      })
      if(admin){
        const auth = await Bcrypt.compare(password, admin.password)
        if(auth){
          //connected
          const maxAge= 60*60*24*30
          var token = jwt.sign({ id: admin.id }, process.env.adminToken, { expiresIn: maxAge })
          res.cookie('admin_token', token, {httpOnly: true, maxAge: maxAge * 1000,
            //  sameSite: 'none', secure: true, path: '/student/*'
          })
          res.status(200).send({response: 'done'})
        }else{
          res.status(400).send({response: 'server_error', message: 'البريد الإلكتروني أو كلمة المرور خاطئة'})
        }
      }else{
        res.status(400).send({response: 'server_error', message: 'البريد الإلكتروني أو كلمة المرور خاطئة'})
      }
    }else{
      // register
      if(validator.isEmail(email)){
        const exist = await Admin.findOne({
          where: {
            email
          }
        })
        if(exist){
          res.status(400).send({response: 'server_error', message: 'حساب آخر تم إنشاؤه بهذا البريد الإلكتروني، جرّب بريدًا إلكترونيًا مختلفًا'})
        }else{
          if(password && password.length > 7){
            const passwordSalte = await Bcrypt.genSalt();
            const hashed_password = await Bcrypt.hash(password, passwordSalte)
            const admin = await Admin.create({
              firstName: 'مسؤول',
              familyName: 'الأكاديمية',
              email,
              description: 'المشرف العام لمنصة أكاديمية الترقي',
              image: '',
              password: hashed_password,
            })
            await adminNotifications.create({
              adminId: admin.id,
              examNotification: true,
              subscriptionNotification: true,
              reportNotification: true,
              newTeacherNotification: true
            })
            const maxAge= 60*60*24*30
            var token = jwt.sign({ id: admin.id }, process.env.adminToken, { expiresIn: maxAge })
            res.cookie('admin_token', token, {httpOnly: true, maxAge: maxAge * 1000,
              //  sameSite: 'none', secure: true, path: '/student/*'
            })
            res.status(200).send({response: 'done'})
          }else{
            res.status(400).send({response: 'server_error', message: 'يجب أن تحتوي كلمة المرور على 8 أحرف أو أكثر'})
          }
        }
      }else{
        res.status(400).send({response: 'server_error', message: 'أدخل بريداً إلكترونياً صالحاً'})
      }
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
      const admin = await Admin.findOne({
        where:{
          email
        }
      })
      if(admin){
        // send reset email
            var random = uuid.v4()
            const salte = await Bcrypt.genSalt();
            const hashed_password_code = await Bcrypt.hash(random, salte)

            await admin.update({
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
                          <a href="`+ process.env.ReactAppUrl + `admin/resetPassword?code=`+ c_pass_code + `&id=` + c_email_id + `">إعادة تعيين كلمة المرور</a>
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
    console.log('req.body')
    console.log(req.body)
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
                        const admin = await Admin.findOne({
                            where: {
                                email: decodedid.email
                            }
                        })
                        if(admin){
                            if(admin.random_pass_code == null ){
                                admin.random_pass_code = ''
                            }
                            // check the code
                            const auth = await Bcrypt.compare(decodedcode.random_pass_code, admin.random_pass_code)
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
                                      await admin.update({
                                          password: hashed_password,
                                          random_pass_code: '',
                                      })
  
                                      res.cookie('admin_token', '', {httpOnly: true, maxAge: 1})
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
    res.cookie('admin_token', '', {httpOnly: true, maxAge: 1})
    res.status(200).send({response: 'done'})
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}

module.exports.getProfileData = async (req, res) => {
  try {
    const admin = await Admin.findOne({
      where: {
        id: req.id
      },
      attributes: ['firstName', 'familyName', 'email', 'description', 'phoneNumber', 'country', 'wilaya', 'image', 'birthDate']
    })
    if(admin){
      res.status(200).send({response: 'done', admin})
    }else{
      res.status(400).send({response: 'not_found', message: 'بيانات هذا المسؤول غير موجودة'})
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
    const { firstName, familyName, phoneNumber, birthDate, country, wilaya, description, image } = req.body
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



    if(description && description.length > 300){
        errors.push({field: 'description', message: 'يجب ألا يحتوي الوصف على أكثر من 300 حرف'})
    }

    if(errors.length > 0){
      res.status(400).send({response: 'invalid_params', errors, message: 'بيانات غير صالحة، تحقق منها مرة أخرى'})
    }else{
      await Admin.update({
        firstName, familyName, phoneNumber, birthDate, country, wilaya, description, image
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

module.exports.savePlatformChanges = async (req, res) => {
  try {
    const { sitePhoneNumber, sitePostalNumber, sitePostalKey } = req.body
    // validation 
    const errors = []

   

   
    if(sitePhoneNumber ){
      if(sitePhoneNumber.length < 10){
        errors.push({field: 'sitePhoneNumber', message: 'أدخل رقم هاتف صالح فقط'})
      }
    }else{
      errors.push({field: 'sitePhoneNumber', message: 'رقم هاتف مطلوب'})
    }

    if(sitePostalNumber ){
      if(sitePostalNumber.length < 2){
        errors.push({field: 'sitePostalNumber', message: 'أدخل رقم بريدي صالح فقط'})
      }
    }else{
      errors.push({field: 'sitePostalNumber', message: ' الرقم البريدي مطلوب'})
    }

    if(sitePostalKey ){
      if(sitePostalKey.length < 2){
        errors.push({field: 'sitePostalKey', message: 'أدخل  مفتاح بريدي صالح فقط'})
      }
    }else{
      errors.push({field: 'sitePostalKey', message: '  المفتاح البريدي مطلوب'})
    }




    if(errors.length > 0){
      res.status(400).send({response: 'invalid_params', errors, message: 'بيانات غير صالحة، تحقق منها مرة أخرى'})
    }else{
      const platfroms = await platform.findAll()
      if(platfroms && platfroms[0]){
        await platform.update({
          phoneNumber: sitePhoneNumber, postalKey: sitePostalKey, postalNumber: sitePostalNumber
        },{
          where:{
            id: platfroms[0].id
          }
        })
        res.status(200).send({response: 'done', message: 'تم حفظ التغييرات بنجاح'})
      }else{
        res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
      }
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}

module.exports.savePassword = async (req, res) => {
  try {
    const {currentPassword, password, confirmPassword} = req.body
    const admin = await Admin.findOne({
      where: {
        id: req.id
      }
    })

    if(admin){
      const auth = await Bcrypt.compare(currentPassword, admin.password)
      if(auth){
        if(password.length > 7){
          if(password == confirmPassword){
            const salte = await Bcrypt.genSalt()
            const hashed_password = await Bcrypt.hash(password, salte)
            await admin.update({
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
    const {reportNotif, subsNotif, newTeacherNotif} = req.body
    if((reportNotif == true || reportNotif == false) && (subsNotif == true || subsNotif == false) && (newTeacherNotif == true || newTeacherNotif == false)){
      await adminNotifications.update({
        reportNotification: reportNotif,
        subscriptionNotification: subsNotif,
        newTeacherNotification: newTeacherNotif
      }, {
        where:{
          adminId: req.id
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
    const notification = await adminNotifications.findOne({
      where: {
        adminId: req.id
      },
      attributes: ['reportNotification', 'subscriptionNotification', 'newTeacherNotification']
    })
    if(notification){
      console.log(notification)
      res.status(200).send({response: 'done', notification })
    }else{
      res.status(400).send({response: 'server_error', message: 'لم يتم العثور على إشعارات هذا المشرف'})
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


module.exports.getStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      attributes:['id', 'firstName', 'familyName', 'email', 'phoneNumber', 'image', 'gender'],
      include: [{ 
        model: StudyProgram,
        through: {
          where: { status: 'start' } // Filter based on the status column in the studentStudyProgram table
        }
      },
      {
        model: Group,
        as: 'groups', // Assuming you've defined 'groups' as the alias for the groups association in your Teacher model
        required: false // Perform a left join
      }]
    })
    const programs = await StudyProgram.findAll({
      attributes: ['id', 'name']
    })
    const groups = await Group.findAll()
    res.status(200).send({response: 'done', students, programs, groups}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}

module.exports.getStudent = async (req, res) => {
  try {
    console.log(req.body.id.id)
    const student = await Student.findOne({
      where: {
        id: req.body.id.id
      },
      include: [{ 
        model: StudyProgram,
        through: {
          where: { status: 'start' } // Filter based on the status column in the studentStudyProgram table
        }
      },{
        model: Subscription,
        as: 'subscription'
      }, {
        model: Group,
        as: 'groups', // Assuming you've defined 'groups' as the alias for the groups association in your Teacher model
        required: false // Perform a left join
      }],
    })
    if(student){
      res.status(200).send({response: 'done', student}) 
    }else{
      res.status(200).send({response: 'notFound'}) 
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.createStudent = async (req, res) => {
  try {
      console.log(req.body)
      const {firstName, familyName, phoneNumber, gender, email, password, sendNotif} = req.body
      const errors = []

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

      console.log(phoneNumber.length)
      if(phoneNumber && phoneNumber.length > 0){
        // good
      }else{
        errors.push({field: 'phoneNumber', message: 'رقم الهاتف مطلوب'})
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

      if(gender && gender.length > 0){
        if(gender == 'أنثى' || gender == 'ذكر'){
          // true
        }else{
          errors.push({field: 'gender', message: 'اختر واحدًا من الخيارات المتاحة'})
        }
      }

      if( errors.length > 0){
        res.status(400).send({response: 'invalid_params', errors, message: 'بيانات غير صالحة، تحقق منها مرة أخرى'})
      }else{
        const passwordSalte = await Bcrypt.genSalt();
        const hashed_password = await Bcrypt.hash(password, passwordSalte)

        const student = await Student.create({
          firstName,
          familyName,
          phoneNumber,
          gender,
          email,
          description: 'طالب قرآن ',
          image: '',
          password: hashed_password,
          verified: true
        })
        await Notification.create({
          studentId: student.id
        })

        if(sendNotif){
          // send Email
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

          var mailOptions = {
            from: '"Taraqi Academi" <' + process.env.MailerUser + '>',
            to: email,
            subject: 'بيانات تسجيل الدخول',
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
                </style>
            </head>
            <body>
                <div class="container">
                    <!-- // header -->
                    <div class="content">
                        <img src="https://i.postimg.cc/sXc5xdkM/Screenshot-2024-03-16-132803-removebg-preview.png" alt="">
                        <h2>بيانات تسجيل الدخول</h2>
                        <p>
                            مرحبًا، 
                            <br>
                            <br>
                            تم إنشاء حسابك، إليك بيانات تسجيل الدخول الخاصة بك
                            <br>
                            <br>
                        </p>

                        <p> 
                            <br>
                            البريد الإلكتروني: `+email+`
                            <br>
                            كلمة المرور: `+password+`
                            <br>
                            رابط المنصة: `+process.env.ReactAppUrl+`student/login
                            <br>
                        </p>

                        <p>
                            <br>
                            يجب عليك تسجيل الدخول وتغيير كلمة المرور الخاصة بك لمنع أي مخاطر.                            <br>
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
                res.status(400).send({response: 'server_error', message: 'لم يتم إرسال البريد الإلكتروني، حدث خطأ غير متوقع على الخادم'})
            } else {
                console.log('Email sent: ' + info.response);
                res.status(200).send({response: 'done', studentId: student.id, message: 'تم إنشاء الطالب بنجاح'})
            }
          });
        }else{
          res.status(200).send({response: 'done', studentId: student.id, message: 'تم إنشاء الطالب بنجاح'}) 
        }
      }

  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}



module.exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.findAll({
      include: [{ model: Student, as: 'student', attributes: ['firstName', 'familyName'] }]
    })
    res.status(200).send({response: 'done', subscriptions}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.confirmSubscription = async (req, res) => {
  try {
    const id = req.body.id
    const subscription  = await Subscription.findOne({
      where: {
        id
      },
      include: [{ model: Student, as: 'student' }]
    })
    if(subscription){
      
      const studentProgram = await studentStudyProgram.findOne({
        where: {
          studentId : subscription.student && subscription.student.id ? subscription.student.id : '',
          status: 'start'
        },
      })

      if(studentProgram){
        const program = await StudyProgram.findOne({where: {id: studentProgram.studyProgramId}})
        if(program){
          var expiredIn = studentProgram.experationDate
          var newDate = new Date(studentProgram.experationDate);
          newDate.setMonth(newDate.getMonth() + Number(subscription.type)  );
          newDate.toDateString()

          await subscription.update({
            status: 'payed',
            paymentDate: new Date(),
            validationDate: studentProgram.experationDate ? studentProgram.experationDate : '',
            expirationDate: newDate
          })
          await studentProgram.update({
            experationDate: newDate
          })
          res.status(200).send({response: 'done', id, from: expiredIn, to: newDate, paymentDate: new Date()}) 
        }else{
          res.status(400).send({response: 'server_error', message: 'البرنامج المشترك به غير موجود'}) 
        }
      }else{
        res.status(400).send({response: 'server_error', message: 'البرنامج المشترك به غير موجود'}) 
      }
      
      const program = await StudyProgram.findOne({where: {id}})
      const CurrentProgram = await studentStudyProgram.findOne({
        where: {
          studentId : req.id,
          status: 'start'
        },
        attributes:['studyProgramId']
      })
    }else{  
      res.status(400).send({response: 'server_error', message: 'لم يتم العثور على الاشتراك'}) 
    }
      // res.status(200).send({response: 'done',}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.getCreateGroupBaseInfo = async (req, res) => {
  try {
    const programs = await StudyProgram.findAll()
    const teachers=  await Teacher.findAll({
      include: [{
        model: Group,
        as: 'groups', // Assuming you've defined 'groups' as the alias for the groups association in your Teacher model
        required: false // Perform a left join
      }],
      where: {
        '$groups.teacherId$': null, // Filter out teachers with no associated groups
        active: true,
        status: 'accepted'
      }
    })

    const students = await Student.findAll({
      include: [{
        model: StudyProgram,
        through: {
          model: studentStudyProgram,
          where: { status: 'start' }
        },
        required: true, // Inner join
      }, {
        model: Group,
        required: false // Left join
      }],
      where: {
        '$groups.id$': null // Filter out students with no associated groups
      }
    })
    
    res.status(200).send({response: 'done', programs, teachers, students}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.createGroup = async (req, res) => {
  try {
    // console.log(req.body)
    const {name, teacher, program, students} = req.body
    
    if(name && name.length > 0){
      // check group name existance
      const group = await Group.findOne({
        where : {
          name
        }
      })
      if(group){
        res.status(400).send({response: 'server_error', message: 'اسم الحلقة موجود بالفعل، جرّب اسمًا آخر'}) 
      }else{
        if(program == 'all'){
          res.status(400).send({response: 'server_error', message: 'يجب أن تختار برنامجاً'}) 
        }else{
          const programExistance = await StudyProgram.findOne({
            where:{
              id: program
            }
          })
          if(programExistance){
            const teacherExistance = await Teacher.findOne({
              where:{
                id: teacher
              }
            })
            if(teacherExistance){
              if(students && students.length > 0){
                var invalid = 0
                for (let s = 0; s < students.length; s++) {
                  const student = students[s];
                  const checkStudentExistance = await Student.findOne({
                    include: [{
                      model: StudyProgram,
                      through: {
                        model: studentStudyProgram,
                        where: { status: 'start' }
                      },
                      required: true, // Inner join
                    }, {
                      model: Group,
                      required: false // Left join
                    }],
                    where: {
                      '$groups.id$': null, // Filter out students with no associated groups
                      id: student
                    }
                  })
                  if(checkStudentExistance){
  
                  }else{
                    invalid = invalid + 1
                  }
                }
                if(invalid == 0){
                  const newGroup = await Group.create({
                    name,
                    studyProgramId: program,
                    teacherId: teacher
                  })
                  for (let j = 0; j < students.length; j++) {
                    const student = students[j];
                    await StudentGroup.create({
                      studentId: student,
                      groupId: newGroup.id
                    })
                  }
                  res.status(200).send({response: 'done', message: 'تم إنشاء الحلقة بنجاح'}) 
                }else{
                  res.status(400).send({response: 'server_error', message: 'هناك  '+invalid+'  من الطلاب غير صالحين للاختيار (يشير هذا الخطأ إلى أن هناك طالبًا على الأقل لم يحدد البرنامج المحدد أو أنه بالفعل في حلقة أخرى. )'}) 
                }
              }else{
                res.status(400).send({response: 'server_error', message: 'يجب أن تختار طالباً واحداً على الأقل'}) 
              }
            }else{
              res.status(400).send({response: 'server_error', message: 'يجب أن تختار أستاذاً '}) 
            }
          }else{
            res.status(400).send({response: 'server_error', message: 'يجب أن تختار برنامجاً'}) 
          }
        }
      }
    }else{
      res.status(400).send({response: 'server_error', message: 'يجب عليك إدخال اسم الحلقة'}) 
    }
    // res.status(200).send({response: 'done',}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.getGroups = async (req, res) => {
  try {
    var data = []
    const groups = await Group.findAll()
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const program = await StudyProgram.findOne({
        where: {
          id: group.studyProgramId
        }
      })
      const teacher = await Teacher.findOne({
        where: {
          id: group.teacherId
        }
      })
      const students = await StudentGroup.findAll({
        where:{
          groupId: group.id
        }
      })
      data.push({id: group.id, name: group.name, program: program.name, teacher: teacher.firstName + ' ' + teacher.familyName, students: students.length, createdAt: group.createdAt})
    }    
    const programs = await StudyProgram.findAll({
      attributes: ['id', 'name']
    })
    res.status(200).send({response: 'done', groups: data, programs}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.getGroup = async (req, res) => {
  try {
    const id = req.body.id.id
    var data = []
    const group = await Group.findOne({
      where: {
        id
      }
    })
    if(group){
      const program = await StudyProgram.findOne({
        where: {
          id: group.studyProgramId
        }
      })
      const teacher = await Teacher.findOne({
        where: {
          id: group.teacherId
        }
      })
      
      const students = await Student.findAll({
        include: [{
          model: StudyProgram,
          where:{
            id: group.studyProgramId
          },
          through: {
            model: studentStudyProgram,
            where: { status: 'start' }
          },
          required: true, // Inner join
        }, {
          model: Group,
          required: false // Left join
        }],
        where: {
          [Op.or]: [
            { '$groups.id$': null },
            { '$groups.id$': group.id }
          ]
        }
      })

      const selectedStudents = await Student.findAll({
        attributes: ['id'],
        include: [{
          model: StudyProgram,
          where:{
            id: group.studyProgramId
          },
          through: {
            model: studentStudyProgram,
            where: { status: 'start' }
          },
          required: true, // Inner join
        }, {
          model: Group,
          required: false // Left join
        }],
        where: {
          '$groups.id$': group.id
        }
      })

      const teachers =  await Teacher.findAll({
        include: [{
          model: Group,
          as: 'groups', // Assuming you've defined 'groups' as the alias for the groups association in your Teacher model
          required: false // Perform a left join
        }],
        where: {
          '$groups.teacherId$': null, // Filter out teachers with no associated groups
          active: true
        }
      })
      res.status(200).send({response: 'done', group, program, teacher, students, teachers, selectedStudents}) 
    }else{
      // not found
      res.status(200).send({response: 'notFound'}) 
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.updateGroup = async (req, res) => {
  try {
    console.log(req.body)
    const {id, name, teacher, program, students} = req.body

    const group = await Group.findOne({
      where: {
        id: id.id
      }
    })

    if(group){
      if(name && name.length > 0){
        // check group name existance
        const checkGroup = await Group.findOne({
          where : {
            name
          }
        })
        if(checkGroup && checkGroup.id != group.id){
          res.status(400).send({response: 'server_error', message: 'اسم الحلقة موجود بالفعل، جرّب اسمًا آخر'}) 
        }else{
              const teacherExistance = await Teacher.findOne({
                where:{
                  id: teacher
                }
              })
              if(teacherExistance){
                const teacherExistanceInGroup = await Group.findOne({
                  where: {
                    teacherId : teacher
                  }
                })
                if(teacherExistanceInGroup && teacherExistanceInGroup.id != group.id){
                  res.status(400).send({response: 'server_error', message: 'المعلم موجود في حلقة أخرى'}) 
                }else{
                  if(students && students.length > 0){
                    var invalid = 0
                    for (let s = 0; s < students.length; s++) {
                      const student = students[s];
                      const checkStudentExistance = await Student.findOne({
                        include: [{
                          model: StudyProgram,
                          through: {
                            model: studentStudyProgram,
                            where: { status: 'start' }
                          },
                          required: true, // Inner join
                        }, {
                          model: Group,
                          required: false // Left join
                        }],
                        where: {
                          [Op.or]: [
                            { '$groups.id$': null },
                            { '$groups.id$': group.id }
                          ],
                          id: student
                        }
                      })
                      if(checkStudentExistance){
      
                      }else{
                        invalid = invalid + 1
                      }
                    }
                    if(invalid == 0){
                      await group.update({
                        name,
                        teacherId: teacher
                      })
  
                      await StudentGroup.destroy({
                        where: {
                          groupId: group.id
                        }
                      })
  
                      for (let j = 0; j < students.length; j++) {
                        const student = students[j];
                        await StudentGroup.create({
                          studentId: student,
                          groupId: group.id
                        })
                      }
                      res.status(200).send({response: 'done', message: 'تم تحديث الحلقة بنجاح'}) 
                    }else{
                      res.status(400).send({response: 'server_error', message: 'هناك  '+invalid+'  من الطلاب غير صالحين للاختيار (يشير هذا الخطأ إلى أن هناك طالبًا على الأقل لم يحدد البرنامج المحدد أو أنه بالفعل في حلقة أخرى. )'}) 
                    }
                  }else{
                    res.status(400).send({response: 'server_error', message: 'يجب أن تختار طالباً واحداً على الأقل'}) 
                  }
                }
              }else{
                res.status(400).send({response: 'server_error', message: 'يجب أن تختار أستاذاً '}) 
              }
           
          
        }
      }else{
        res.status(400).send({response: 'server_error', message: 'يجب عليك إدخال اسم الحلقة'}) 
      }
    }else{
      res.status(200).send({response: 'notFound'}) 
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.createProgram = async (req, res) => {
  console.log(req.body)
  try {
    const {name, description, age, duration, studyDuration, vacationDuration, semesters, level, price, status} = req.body
    const nameExistance = await StudyProgram.findOne({
      where: {
        name
      }
    })
    if(nameExistance){
      res.status(400).send({response: 'server_error', message: 'الاسم غير صالح، يوجد برنامج بهذا الاسم'}) 
    }else{
      if(Number(level)){
        if(level > 0){
          if(Number(price) || price == '0'){
            if(price >= 0){
              if(status == true || status == false){
                await StudyProgram.create({
                  name, description, age, duration, studyDuration, vacationDuration, levelsDescription: JSON.stringify(semesters), levels: level, price, status : status == true ? 'available' : 'notAvailable'
                })
                res.status(200).send({response: 'done', message: 'تم إنشاء البرنامج بنجاح'}) 
              }else{
                res.status(400).send({response: 'server_error', message: 'تأكد من تفعيل البرنامج'}) 
              }             
            }else{
              res.status(400).send({response: 'server_error', message: 'لا يمكن أن يكون السعر أقل من 0'}) 
            }
          }else{
            if(price == ""){
              res.status(400).send({response: 'server_error', message: 'السعر  مطلوب'}) 
            }else{
              res.status(400).send({response: 'server_error', message: 'السعر غير صالح'}) 
            }
          }
        }else{
          res.status(400).send({response: 'server_error', message: 'لا يمكن أن يكون عدد المستويات أقل من 1'}) 
        }
      }else{
        res.status(400).send({response: 'server_error', message: 'عدد المستويات غير صالح'}) 
      }
    }
    // res.status(200).send({response: 'done',}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.getProgramsWithStudentCount = async (req, res) => {
  try {
    const programs = await StudyProgram.findAll()
    var data= []
    for (let i = 0; i < programs.length; i++) {
      const program = programs[i];
      var count = await studentStudyProgram.count({
        where: {
          studyProgramId: program.id
        }
      })
      data.push({name: program.name, id: program.id, students: count, duration: program.duration, createdAt: program.createdAt, status: program.status})
    }
    
    res.status(200).send({response: 'done', programs: data})
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'})
  }
}


module.exports.updateProgram = async (req, res) => {
  console.log(req.body)
  try {
    const {id, name, description, age, duration, studyDuration, vacationDuration, semesters, level, price, status} = req.body
    const nameExistance = await StudyProgram.findOne({
      where: {
        name
      }
    })
    if(nameExistance && nameExistance.id != id){
      res.status(400).send({response: 'server_error', message: 'الاسم غير صالح، يوجد برنامج بهذا الاسم'}) 
    }else{
      if(Number(level)){
        if(level > 0){
          if(Number(price) || price == '0'){
            if(price >= 0){
              if(status == true || status == false){
                await StudyProgram.update({
                  name, description, age, duration, studyDuration, vacationDuration, levelsDescription: JSON.stringify(semesters), levels: level, price, status : status == true ? 'available' : 'notAvailable'
                },{
                  where:{
                    id
                  }
                })
                res.status(200).send({response: 'done', message: 'تم تعديل البرنامج بنجاح'}) 
              }else{
                res.status(400).send({response: 'server_error', message: 'تأكد من تفعيل البرنامج'}) 
              }             
            }else{
              res.status(400).send({response: 'server_error', message: 'لا يمكن أن يكون السعر أقل من 0'}) 
            }
          }else{
            if(price == ""){
              res.status(400).send({response: 'server_error', message: 'السعر  مطلوب'}) 
            }else{
              res.status(400).send({response: 'server_error', message: 'السعر غير صالح'}) 
            }
          }
        }else{
          res.status(400).send({response: 'server_error', message: 'لا يمكن أن يكون عدد المستويات أقل من 1'}) 
        }
      }else{
        res.status(400).send({response: 'server_error', message: 'عدد المستويات غير صالح'}) 
      }
    }
    // res.status(200).send({response: 'done',}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.deleteProgram = async (req, res, next) => {
  try {
    console.log(req.body)
    await StudyProgram.destroy({
      where: {
        id: req.body.id
      }
    })
    next()
    // res.status(200).send({response: 'done',}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.askForReportBaseInfo = async (req, res) => {
  try {
    const teachers = await Teacher.findAll({
      attributes:['firstName', 'familyName', 'id']
    })
    var data = []
    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i];
      var group = await Group.findOne({
        where: {
          teacherId: teacher.id
        }
      })
      var name = ''
      if(group){
        const program = await StudyProgram.findOne({
          where: {
            id: group.studyProgramId
          }
        })
        if(program){
          name = program.name
        }
      }
      data.push({name: teacher.firstName + ' ' + teacher.familyName, id: teacher.id, program: name})
    }
    res.status(200).send({response: 'done', teachers: data}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.askForReport = async (req, res) => {
  try {
    console.log(req.body)
    const {receivers, title, text} = req.body
    if(receivers && receivers.length > 0){
      if(title && title.length > 0){
        const currentMillis = new Date().getTime();
        const randomNumber = Math.floor(Math.random() * 10000);
        const campaign = currentMillis.toString() + randomNumber.toString();

        for (let i = 0; i < receivers.length; i++) {
          const receiver = receivers[i];
          await Report.create({
            adminId: req.id,
            teacherId: receiver.id,
            campaign,
            title,
            text,
            reply: '',
          })
          await TeacherNotifications.create({
            teacherId: receiver.id,
            type: 'report',
            value: 'تم استلام طلب إرسال تقرير ' + title
          })
        }
        res.status(200).send({response: 'done', message: 'تم إرسال التقارير بنجاح'}) 
      }else{
        res.status(400).send({response: 'server_error', message: 'عنوان التقرير مطلوب'}) 
      }
    }else{
      res.status(400).send({response: 'server_error', message: 'يجب اختيار المعلم المرسل إليه'}) 
    }
    // res.status(200).send({response: 'done', message: 'تم إرسال التقارير بنجاح'}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.getReports = async (req, res) => {
  try {
    const reports = await Report.findAll({
      include:[{
        model: Teacher,
        as: 'teacher',
        attributes: ['firstName', 'familyName']
      }]
    })
    res.status(200).send({response: 'done', reports}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.getReport = async (req, res) => {
  try {
    console.log(req.body)
    const report = await Report.findOne({
      where: {
        id: req.body.id
      },
      include:[{
        model: Teacher,
        as: 'teacher',
        attributes: ['firstName', 'familyName']
      }]
    })
    if(report){
      res.status(200).send({response: 'done', report}) 
    }else{
      res.status(200).send({response: 'notFound'}) 
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.deleteReport = async (req, res, next) => {
  try {
    console.log(req.body)
    await Report.destroy({
      where: {
        id: req.body.id
      }
    })
    next()
    // res.status(200).send({response: 'done',}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.createTeacher = async (req, res) => {
  try {
      console.log(req.body)
      const {firstName, familyName, phoneNumber, gender, email, password, sendNotif} = req.body
      const errors = []

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

      console.log(phoneNumber.length)
      if(phoneNumber && phoneNumber.length > 0){
        // good
      }else{
        errors.push({field: 'phoneNumber', message: 'رقم الهاتف مطلوب'})
      }

      if(email && email.length > 0){
        if(validator.isEmail(email)){
          const exist = await Teacher.findOne({
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

      if(gender && gender.length > 0){
        if(gender == 'أنثى' || gender == 'ذكر'){
          // true
        }else{
          errors.push({field: 'gender', message: 'اختر واحدًا من الخيارات المتاحة'})
        }
      }

      if( errors.length > 0){
        res.status(400).send({response: 'invalid_params', errors, message: 'بيانات غير صالحة، تحقق منها مرة أخرى'})
      }else{
        const passwordSalte = await Bcrypt.genSalt();
        const hashed_password = await Bcrypt.hash(password, passwordSalte)

        const teacher = await Teacher.create({
          firstName,
          familyName,
          phoneNumber,
          gender,
          email,
          description: 'معلم قرآن ',
          image: '',
          password: hashed_password,
          verified: true,
          active: true,
          status: 'accepted'
        })
      
        if(sendNotif){
          // send Email
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

          var mailOptions = {
            from: '"Taraqi Academi" <' + process.env.MailerUser + '>',
            to: email,
            subject: 'بيانات تسجيل الدخول',
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
                </style>
            </head>
            <body>
                <div class="container">
                    <!-- // header -->
                    <div class="content">
                        <img src="https://i.postimg.cc/sXc5xdkM/Screenshot-2024-03-16-132803-removebg-preview.png" alt="">
                        <h2>بيانات تسجيل الدخول</h2>
                        <p>
                            مرحبًا، 
                            <br>
                            <br>
                            تم إنشاء حسابك، إليك بيانات تسجيل الدخول الخاصة بك
                            <br>
                            <br>
                        </p>

                        <p> 
                            <br>
                            البريد الإلكتروني: `+email+`
                            <br>
                            كلمة المرور: `+password+`
                            <br>
                            رابط المنصة: `+process.env.ReactAppUrl+`teacher/login
                            <br>
                        </p>

                        <p>
                            <br>
                            يجب عليك تسجيل الدخول وتغيير كلمة المرور الخاصة بك لمنع أي مخاطر.                            <br>
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
                res.status(400).send({response: 'server_error', message: 'لم يتم إرسال البريد الإلكتروني، حدث خطأ غير متوقع على الخادم'})
            } else {
                console.log('Email sent: ' + info.response);
                res.status(200).send({response: 'done', teacherId: teacher.id, message: 'تم إنشاء المعلم بنجاح'})
            }
          });
        }else{
          res.status(200).send({response: 'done', teacherId: teacher.id, message: 'تم إنشاء المعلم بنجاح'}) 
        }
      }

  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.getTeacher = async (req, res) => {
  try {
    console.log(req.body.id.id)
    const teacher = await Teacher.findOne({
      where: {
        id: req.body.id.id
      },
      include: [{ 
        model: Group,
        as: 'groups',
      }],
    })
    if(teacher){
      var programName = ''
      if(teacher && teacher.groups && teacher.groups[0]){
        const program = await StudyProgram.findOne({
          where: {
            id: teacher.groups[0].studyProgramId
          }
        })
        if(program){
          programName = program.name
        }
      }
      res.status(200).send({response: 'done', teacher, programName}) 
    }else{
      res.status(200).send({response: 'notFound'}) 
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.findAll({
      where:{
        status: 'accepted'
      }
    })
    var data = []
    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i];
      const group = await Group.findOne({
        where: {
          teacherId: teacher.id
        }
      })
      var program = ''
      var programId = ''
      if(group){
        const studyProgram = await StudyProgram.findOne({
          where:{
            id: group.studyProgramId
          }
        })
        if(studyProgram){
          program = studyProgram.name
          programId = studyProgram.id
        }
      }
      data.push({id: teacher.id, firstName: teacher.firstName, familyName: teacher.familyName, email: teacher.email,  group: group ? group.name : '', program, programId, createdAt:  teacher.createdAt, banned: teacher.banned})
    }
    const programs = await StudyProgram.findAll({
      attributes: ['id', 'name']
    })
    const groups = await Group.findAll()
    res.status(200).send({response: 'done', teachers: data, programs, groups}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.blockTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.update({
      banned: req.body.block
    },{
      where:{
        id: req.body.id
      }
    })
    res.status(200).send({response: 'done', teacher}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.getRequestedTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.findAll({
      where: {
        status: 'requested'
      }
    })
    res.status(200).send({response: 'done', teachers}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}

module.exports.changeTeacherStatus = async (req, res) => {
  try {
    console.log(req.body)
    if(req.body.status == 'accept' || req.body.status == 'refuse'){
      await Teacher.update({
        status: req.body.status == 'accept' ? 'accepted' : 'refused'
      },{
        where:{
          id: req.body.id
        }
      })
      res.status(200).send({response: 'done'}) 
    }else{
      res.status(200).send({response: 'invalidStatus'}) 
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}

module.exports.createExamBaseInfo = async (req, res) => {
  try {
    const groups = await Group.findAll()
    var data = []
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const program = await StudyProgram.findOne({
        where: {
          id: group.studyProgramId
        }
      })
      data.push({id: group.id, name: group.name, program: program ? program.name : ''})
    }
    res.status(200).send({response: 'done', groups: data}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}



module.exports.createExam = async (req, res) => {
  try {
    console.log(req.body)
    const { title, type, selectedGroups, time, description, startExam, endExam, instructions, questions } = req.body;
    const errors = [];
    var note = 0
    // Check if title is provided
    if (!title || title.length === 0) {
        errors.push('عنوان الامتحان مطلوب');
    }

    // Check if type is provided and valid
    if (!type || (type !== "levelUpExam" && type !== "simpleExam")) {
        errors.push('نوع الامتحان مطلوب');
    }

    // Check if selected groups are provided
    if (!selectedGroups || selectedGroups.length === 0) {
        errors.push('يجب عليك اختيار حلقة واحدة على الأقل');
    }

    // Check if time is provided and valid
    if (!time || time <= 0) {
        errors.push('وقت الامتحان مطلوب');
    }

    // Check if startExam is provided and is a valid date
    if (!startExam || !validator.isDate(new Date(startExam))) {
        errors.push('تاريخ بدء الامتحان مطلوب');
    }

    // Check if endExam is provided and is a valid date
    if (!endExam || !validator.isDate(new Date(endExam))) {
        errors.push('تاريخ انتهاء الامتحان مطلوب');
    }

    // Check if questions are provided
    if (!questions || questions.length === 0) {
        errors.push('أسئلة الامتحان مطلوبة');
    } else {
        // Validate each question
        questions.forEach((question, index) => {
            if (!question.question || question.question.length === 0) {
                errors.push('السؤال ' + (index + 1) + ' مطلوب');
            } else {
                if (question.type === "options") {
                    if (!question.point || question.point <= 0) {
                      errors.push('نقطة السؤال ' + (index + 1) + ' مطلوبة');
                    }else{
                      note = note + Number(question.point)
                    }
                    if (!question.options || question.options.length < 2) {
                        errors.push('يجب أن يحتوي السؤال ' + (index + 1) + ' على خيارين على الأقل');
                    } else {
                        question.options.forEach((option, optionIndex) => {
                            if (!option.value || option.value.length === 0) {
                                errors.push('الخيار ' + (optionIndex + 1) + ' من السؤال ' + (index + 1) + ' مطلوب');
                            }
                            if (option.answer === undefined || (option.answer !== true && option.answer !== false)) {
                                errors.push('تصحيح الخيار ' + (optionIndex + 1) + ' من السؤال ' + (index + 1) + ' مطلوب');
                            }
                        });
                    }
                } else if (question.type === "text") {
                    if (!question.point || question.point <= 0) {
                        errors.push('نقطة السؤال ' + (index + 1) + ' مطلوبة');
                    }else{
                      note = note + Number(question.point)
                    }
                } else {
                    errors.push('نوع السؤال ' + (index + 1) + ' مطلوب');
                }
            }
        });
    }

    // If there are any errors, send them back in a single response
    if (errors.length > 0) {
        console.log(errors[0])
        res.status(400).send({ response: 'server_error', message: errors[0] });
    } else {
        // Proceed with creating the exam
        const exam = await Exam.create({
          title, type, time, startExam, endExam, instructions, description, questions: JSON.stringify(questions), note
        })

        for (let i = 0; i < selectedGroups.length; i++) {
          const group = selectedGroups[i];
          await groupExam.create({
            examId: exam.id,
            groupId: group.id
          })
        }
        res.status(200).send({response: 'done'}) 
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}

module.exports.getExams = async (req, res) => {
  try {
    const exams = await Exam.findAll({
      order: [['createdAt', 'DESC']],
      include: [{
        model: Group,
        through: 'groupExam' // Assuming your through model is named groupExam
      }]
    })
    const programs = await StudyProgram.findAll()
    const groups = await Group.findAll()
    res.status(200).send({response: 'done', exams, programs, groups}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.getExam = async (req, res) => {
  try {
    const {id} = req.body
    console.log(id)
    const exam = await Exam.findOne({
      where: {
        id
      },
      include: [{
        model: Student,
        attributes: ['firstName', 'familyName', 'email', 'id'],
        through: StudentExam // Assuming your through model is named groupExam
      }]
    })
    console.log(exam)
    if(exam){
      res.status(200).send({response: 'done', exam}) 
    }else{
      res.status(200).send({response: 'notFound'}) 
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.correctExam = async (req, res) => {
  try {
      console.log(req.body)
      const {id, answers} = req.body
      const exam = await StudentExam.findOne({
        where:{
          id
        }
      })

      if(exam){
        var note = 0
        for (let i = 0; i < answers.length; i++) {
          const answer = answers[i];
          if(answer.note && !isNaN(answer.note)){
            note = note + Number(answer.note)
          }
        }
        await exam.update({
          note,
          noteStatus: 'corrected',
          answers: JSON.stringify(answers)
        })
        res.status(200).send({response: 'done', message: 'تم حفظ التصحيح'}) 

      }else{
        res.status(400).send({response: 'server_error', message: 'لم يتم العثور على الامتحان'}) 
      }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.getAddSubsBaseInfo = async (req, res) => {
  try {
    const students = await Student.findAll({
      attributes:['id', 'firstName', 'familyName', 'email', 'phoneNumber', 'image', 'gender'],
      include: [{ 
        model: StudyProgram,
        through: {
          where: { status: 'start' } // Filter based on the status column in the studentStudyProgram table
        }
      },
      {
        model: Group,
        as: 'groups', // Assuming you've defined 'groups' as the alias for the groups association in your Teacher model
        required: false // Perform a left join
      }]
    })
    const programs = await StudyProgram.findAll({
      attributes: ['id', 'name']
    })
    const groups = await Group.findAll()
    res.status(200).send({response: 'done', students, programs, groups}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}

module.exports.addSubs = async (req, res) => {
  try {
    console.log(req.body)
    const {selectedStudents, type, days, status, paymentDate, price} = req.body
    if(selectedStudents && selectedStudents.length > 0){
      if(type == '1' || type == '3' || type == '6' || type == '12' || type == 'special'){
        if(status == 'payed' || status == 'snoozed'){
          if(type == 'special' && days < 1){
            res.status(400).send({response: 'server_error', message: 'الأيام يجب أن تكون أكثر من 0'}) 
          }else{
            for (let s = 0; s < selectedStudents.length; s++) {
              const student = selectedStudents[s];
              const studentProgram = await studentStudyProgram.findOne({
                where:{
                  status: 'start',
                  studentId: student
                }
              })
              if(studentProgram){
                var dateObject = new Date(studentProgram.experationDate);
                console.log(dateObject)
                if(type == 'special'){
                  dateObject.setDate(dateObject.getDate() + Number(days));
                }else{
                  dateObject.setMonth(dateObject.getMonth() + Number(type));
                }
                console.log(dateObject)
                const validationDate = studentProgram.experationDate
                await studentProgram.update({
                  experationDate: dateObject
                })
                const program = await StudyProgram.findOne({
                  where:{
                    id: studentProgram.studyProgramId
                  }
                })
                await Subscription.create({
                  paymentDate: '',
                  validationDate: validationDate,
                  expirationDate: dateObject,
                  type: type,
                  status,
                  program: program ? program.name : '',
                  studentId: student,
                  paymentDate: status == 'payed' &&  validator.isDate(paymentDate) ? paymentDate : '',
                  amount: status == 'payed' && price > 0 ? price : 0
                })
              }
            }
            res.status(200).send({response: 'done', message: 'تمت إضافة الاشتراك بنجاح'}) 

          }
        }else{
          res.status(400).send({response: 'server_error', message: 'يجب عليك تحديد حالة الاشتراك'}) 
        }
      }else{
        res.status(400).send({response: 'server_error', message: 'يجب عليك تحديد نوع الاشتراك'}) 
      }
    }else{
      res.status(400).send({response: 'server_error', message: 'يجب أن تختار طالبًا واحدًا على الأقل'}) 
    }
    //res.status(200).send({response: 'done'}) 
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}


module.exports.getPlatformData = async (req, res) => {
  try {
    const platfroms = await platform.findAll()
    if(platfroms.length > 0){
      res.status(200).send({response: 'done', platform: platfroms[0]}) 
    }else{
      await platform.create({
        phoneNumber: '',
        postalKey: '',
        postalNumber: ''
      })
      const newPlatfroms = await platform.findAll()
      if(newPlatfroms.length > 0){
        res.status(200).send({response: 'done', platform: newPlatfroms[0]}) 
      }else{
        res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
      }
    }
  } catch (error) {
    console.log(error)
    res.status(400).send({response: 'server_error', message: 'خطأ داخلي في الخادم، حاول مرة أخرى لاحقاً'}) 
  }
}

module.exports.getHomeBaseInfo = async (req, res) => {
  try {
    const availablePrograms = await StudyProgram.count({
      where:{
        status: 'available'
      }
    })
    const availableTeachers = await Teacher.count({
      where:{
        status: 'accepted'
      }
    })
    const requestedTeachers = await Teacher.findAll({
      where:{
        status: 'requested'
      },
      attributes:['firstName', 'familyName', 'email', 'phoneNumber', 'id', 'createdAt']
    })

    const availableStudents = await Student.count()

    const programs = await StudyProgram.findAll()
    
    const studentsInPrograms = {programs: [], count: []}
    for (let i = 0; i < programs.length; i++) {
      const program = programs[i];
      const count = await studentStudyProgram.count({
        where:{
          studyProgramId: program.id
        }
      })
      if(i < 6) {
        studentsInPrograms.programs.push(program.name)
        studentsInPrograms.count.push(count)
      }
    }

    res.status(200).send({response: 'done', availablePrograms, availableTeachers, availableStudents, studentsInPrograms, requestedTeachers}) 
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