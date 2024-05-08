const { Router } = require('express');
const studentController = require('../controllers/studentController');
const studentMiddleware = require('../middleware/student');
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })

const studentRouter = Router();
studentRouter.get('/addDemoData', studentController.addDemoData)
studentRouter.get('/getDemoData', studentController.getDemoData)


studentRouter.post('/studentApi/register', studentController.register)
studentRouter.post('/studentApi/confirmEmail', studentController.confirmEmail)
studentRouter.post('/studentApi/login', studentController.login)
studentRouter.post('/studentApi/resetPassword', studentController.resetPassword)
studentRouter.post('/studentApi/checkResetPassword', studentController.checkResetPassword)
studentRouter.post('/studentApi/CheckConnexion', studentMiddleware.CheckConnexion)
studentRouter.post('/studentApi/logout', studentController.logout)
studentRouter.post('/studentApi/getProfileData', studentMiddleware.CheckAuth, studentController.getProfileData)
studentRouter.post('/studentApi/uploadPhoto', studentMiddleware.CheckAuth, upload.single('file'), studentController.uploadPhoto)
studentRouter.get('/studentApi/pics/:image', studentMiddleware.CheckAuth, studentController.getImage)
studentRouter.post('/studentApi/saveProfileChanges', studentMiddleware.CheckAuth, studentController.saveProfileChanges)
studentRouter.post('/studentApi/savePassword', studentMiddleware.CheckAuth, studentController.savePassword)
studentRouter.post('/studentApi/saveNotifChanges', studentMiddleware.CheckAuth, studentController.saveNotifChanges)
studentRouter.post('/studentApi/getNotifications', studentMiddleware.CheckAuth, studentController.getNotifications)
studentRouter.post('/studentApi/getPrograms', studentMiddleware.CheckAuth, studentController.getPrograms)
studentRouter.post('/studentApi/getProgram', studentMiddleware.CheckAuth, studentController.getProgram)
studentRouter.post('/studentApi/programRegistration', studentMiddleware.CheckAuth, studentController.programRegistration)
studentRouter.post('/studentApi/getSubscriptions', studentMiddleware.CheckAuth, studentController.getSubscriptions)
studentRouter.post('/studentApi/getPaymentDetails', studentMiddleware.CheckAuth, studentController.getPaymentDetails)
studentRouter.post('/studentApi/addSubscription', studentMiddleware.CheckAuth, studentController.addSubscription)
studentRouter.post('/studentApi/getExams', studentMiddleware.CheckAuth, studentController.getExams)
studentRouter.post('/studentApi/enterExam', studentMiddleware.CheckAuth, studentController.enterExam)
studentRouter.post('/studentApi/getExam', studentMiddleware.CheckAuth, studentController.getExam)
studentRouter.post('/studentApi/saveExam', studentMiddleware.CheckAuth, studentController.saveExam)

module.exports = studentRouter;
