const Sequelize = require('sequelize')
const validator = require('validator')
const {phone} = require('phone')
const Op = Sequelize.Op;
const Student = require('../models/student')
const jwt = require('jsonwebtoken');
const studentStudyProgram = require('../models/studentStudyProgram');


module.exports.CheckConnexion = async (req, res) => {
    try {
        const token = req.cookies.student_token
        console.log(req.cookies)
        if(token){
            jwt.verify(token, process.env.studentToken, async (err, decodedToken) =>{
                if(err){
                    res.cookie('student_token', '', {httpOnly: true, maxAge: 1})
                    res.status(401).send({response: 'unauthorized', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
                }else{
                    req.id= decodedToken.id
                    const student = await Student.findOne({
                        where: {
                            id: decodedToken.id
                        }
                    })
                    if(student){
                        if(student.banned == true){
                            res.cookie('student_token', '', {httpOnly: true, maxAge: 1})
                            res.status(401).send({response: 'unauthorized', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
                        }else{
                            const program = await studentStudyProgram.findOne({
                                where: {
                                    studentId : decodedToken.id,
                                    status: 'start'
                                }
                            })
                            var programChosed = false
                            if(program){
                                programChosed = true
                            }
                            const studentDetails = {firstName: student.firstName, familyName: student.familyName, email: student.email, programChosed: '', programChosed}
                            res.status(200).send({response: 'done', student: studentDetails})
                        }
                    }else{
                        res.cookie('student_token', '', {httpOnly: true, maxAge: 1})
                        res.status(401).send({response: 'unauthorized', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
                    }
                }
            })
        }else{
            res.status(401).send({response: 'unauthorized', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
        }
    } catch (error) {
        console.log(error)
        res.status(401).send({response: 'unauthorized', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
    }
}


module.exports.CheckAuth = async (req, res, next) => {
    try {
        const token = req.cookies.student_token
        console.log(req.cookies)
        if(token){
            jwt.verify(token, process.env.studentToken, async (err, decodedToken) =>{
                if(err){
                    res.cookie('student_token', '', {httpOnly: true, maxAge: 1})
                    res.status(401).send({response: 'unauthorized', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
                }else{
                    req.id= decodedToken.id
                    const student = await Student.findOne({
                        where: {
                            id: decodedToken.id
                        }
                    })
                    if(student){
                        if(student.banned == true){
                            res.cookie('student_token', '', {httpOnly: true, maxAge: 1})
                            res.status(401).send({response: 'unauthorized', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
                        }else{
                            req.id = decodedToken.id
                            next()
                        }
                    }else{
                        res.cookie('student_token', '', {httpOnly: true, maxAge: 1})
                        res.status(401).send({response: 'unauthorized', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
                    }
                }
            })
        }else{
            res.status(401).send({response: 'unauthorized', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
        }
    } catch (error) {
        console.log(error)
        res.status(401).send({response: 'unauthorized', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
    }
}