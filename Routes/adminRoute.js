const { Router } = require('express');
const adminController = require('../controllers/adminController');
const adminMiddleware = require('../middleware/admin');
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })

const adminRouter = Router();

// added
adminRouter.post('/adminApi/checkLogin', adminMiddleware.checkLogin)
adminRouter.post('/adminApi/getStudents', adminMiddleware.CheckAuth, adminController.getStudents)
adminRouter.post('/adminApi/getStudent', adminMiddleware.CheckAuth, adminController.getStudent)
adminRouter.post('/adminApi/createStudent', adminMiddleware.CheckAuth, adminController.createStudent)

adminRouter.post('/adminApi/getAllSubscriptions', adminMiddleware.CheckAuth, adminController.getAllSubscriptions)
adminRouter.post('/adminApi/confirmSubscription', adminMiddleware.CheckAuth, adminController.confirmSubscription)
adminRouter.post('/adminApi/getAddSubsBaseInfo', adminMiddleware.CheckAuth, adminController.getAddSubsBaseInfo)
adminRouter.post('/adminApi/addSubs', adminMiddleware.CheckAuth, adminController.addSubs)

adminRouter.post('/adminApi/getCreateGroupBaseInfo', adminMiddleware.CheckAuth, adminController.getCreateGroupBaseInfo)
adminRouter.post('/adminApi/createGroup', adminMiddleware.CheckAuth, adminController.createGroup)
adminRouter.post('/adminApi/getGroups', adminMiddleware.CheckAuth, adminController.getGroups)
adminRouter.post('/adminApi/getGroup', adminMiddleware.CheckAuth, adminController.getGroup)
adminRouter.post('/adminApi/updateGroup', adminMiddleware.CheckAuth, adminController.updateGroup)

adminRouter.post('/adminApi/createProgram', adminMiddleware.CheckAuth, adminController.createProgram)
adminRouter.post('/adminApi/getProgramsWithStudentCount', adminMiddleware.CheckAuth, adminController.getProgramsWithStudentCount)
adminRouter.post('/adminApi/updateProgram', adminMiddleware.CheckAuth, adminController.updateProgram)
adminRouter.post('/adminApi/deleteProgram', adminMiddleware.CheckAuth, adminController.deleteProgram, adminController.getProgramsWithStudentCount)

adminRouter.post('/adminApi/askForReportBaseInfo', adminMiddleware.CheckAuth, adminController.askForReportBaseInfo)
adminRouter.post('/adminApi/askForReport', adminMiddleware.CheckAuth, adminController.askForReport)
adminRouter.post('/adminApi/getReports', adminMiddleware.CheckAuth, adminController.getReports)
adminRouter.post('/adminApi/getReport', adminMiddleware.CheckAuth, adminController.getReport)
adminRouter.post('/adminApi/deleteReport', adminMiddleware.CheckAuth, adminController.deleteReport, adminController.getReports)

adminRouter.post('/adminApi/createTeacher', adminMiddleware.CheckAuth, adminController.createTeacher)
adminRouter.post('/adminApi/getTeacher', adminMiddleware.CheckAuth, adminController.getTeacher)
adminRouter.post('/adminApi/getTeachers', adminMiddleware.CheckAuth, adminController.getTeachers)
adminRouter.post('/adminApi/blockTeacher', adminMiddleware.CheckAuth, adminController.blockTeacher)
adminRouter.post('/adminApi/getRequestedTeachers', adminMiddleware.CheckAuth, adminController.getRequestedTeachers)
adminRouter.post('/adminApi/changeTeacherStatus', adminMiddleware.CheckAuth, adminController.changeTeacherStatus)


adminRouter.post('/adminApi/createExamBaseInfo', adminMiddleware.CheckAuth, adminController.createExamBaseInfo)
adminRouter.post('/adminApi/createExam', adminMiddleware.CheckAuth, adminController.createExam)
adminRouter.post('/adminApi/getExams', adminMiddleware.CheckAuth, adminController.getExams)
adminRouter.post('/adminApi/getExam', adminMiddleware.CheckAuth, adminController.getExam)
adminRouter.post('/adminApi/correctExam', adminMiddleware.CheckAuth, adminController.correctExam)

adminRouter.post('/adminApi/getProfileData', adminMiddleware.CheckAuth, adminController.getProfileData)
adminRouter.post('/adminApi/getPlatformData', adminMiddleware.CheckAuth, adminController.getPlatformData)

adminRouter.post('/adminApi/saveProfileChanges', adminMiddleware.CheckAuth, adminController.saveProfileChanges)
adminRouter.post('/adminApi/savePlatformChanges', adminMiddleware.CheckAuth, adminController.savePlatformChanges)
adminRouter.post('/adminApi/savePassword', adminMiddleware.CheckAuth, adminController.savePassword)
adminRouter.post('/adminApi/getNotifications', adminMiddleware.CheckAuth, adminController.getNotifications)
adminRouter.post('/adminApi/saveNotifChanges', adminMiddleware.CheckAuth, adminController.saveNotifChanges)
adminRouter.post('/adminApi/uploadPhoto', adminMiddleware.CheckAuth, upload.single('file'), adminController.uploadPhoto)

adminRouter.post('/adminApi/logout', adminController.logout)
adminRouter.post('/adminApi/CheckConnexion', adminMiddleware.CheckConnexion)

adminRouter.post('/adminApi/getHomeBaseInfo', adminMiddleware.CheckAuth, adminController.getHomeBaseInfo)


// copied
adminRouter.post('/adminApi/confirmEmail', adminController.confirmEmail)
adminRouter.post('/adminApi/login', adminController.login)
adminRouter.post('/adminApi/resetPassword', adminController.resetPassword)
adminRouter.post('/adminApi/checkResetPassword', adminController.checkResetPassword)
// adminRouter.post('/adminApi/getProfileData', adminMiddleware.CheckAuth, adminController.getProfileData)
adminRouter.get('/adminApi/pics/:image', adminMiddleware.CheckAuth, adminController.getImage)
adminRouter.post('/adminApi/getPrograms', adminMiddleware.CheckAuth, adminController.getPrograms)
adminRouter.post('/adminApi/getProgram', adminMiddleware.CheckAuth, adminController.getProgram)
adminRouter.post('/adminApi/programRegistration', adminMiddleware.CheckAuth, adminController.programRegistration)
adminRouter.post('/adminApi/getSubscriptions', adminMiddleware.CheckAuth, adminController.getSubscriptions)
adminRouter.post('/adminApi/getPaymentDetails', adminMiddleware.CheckAuth, adminController.getPaymentDetails)

module.exports = adminRouter;
