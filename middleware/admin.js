const Sequelize = require('sequelize')
const validator = require('validator')
const {phone} = require('phone')
const Op = Sequelize.Op;
const Student = require('../models/student')
const jwt = require('jsonwebtoken');
const studentStudyProgram = require('../models/studentStudyProgram');
const Admin = require('../models/admin');


module.exports.checkLogin = async (req, res) => {
    try {
        const token = req.cookies.admin_token
        const admins = await Admin.findAll()
        if(token){
            jwt.verify(token, process.env.adminToken, async (err, decodedToken) =>{
                if(err){
                    res.cookie('admin_token', '', {httpOnly: true, maxAge: 1})
                    res.status(200).send({response: 'unauthorized',newAccount: admins.length > 0 ? false : true,  message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
                }else{
                    req.id= decodedToken.id
                    const admin = await Admin.findOne({
                        where: {
                            id: decodedToken.id
                        }
                    })
                    if(admin){
                        res.status(200).send({response: 'connected',})
                    }else{
                        res.cookie('admin_token', '', {httpOnly: true, maxAge: 1})
                        res.status(200).send({response: 'unauthorized', newAccount: admins.length > 0 ? false : true, message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
                    }
                }
            })
        }else{
            res.cookie('admin_token', '', {httpOnly: true, maxAge: 1})
            res.status(200).send({response: 'unauthorized', newAccount: admins.length > 0 ? false : true, message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
        }
    } catch (error) {
        console.log(error)
        res.status(400).send({response: 'unauthorized', newAccount: false, message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
    }
}


module.exports.CheckConnexion = async (req, res) => {
    try {
        const token = req.cookies.admin_token
        console.log(req.cookies)
        if(token){
            jwt.verify(token, process.env.adminToken, async (err, decodedToken) =>{
                if(err){
                    res.cookie('admin_token', '', {httpOnly: true, maxAge: 1})
                    res.status(401).send({response: 'unauthorized_admin', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
                }else{
                    req.id= decodedToken.id
                    const admin = await Admin.findOne({
                        where: {
                            id: decodedToken.id
                        }
                    })
                    if(admin){
                        
                        const adminDetails = {firstName: admin.firstName, familyName: admin.familyName, email: admin.email}
                        res.status(200).send({response: 'done', admin: adminDetails})
                    }else{
                        res.cookie('student_token', '', {httpOnly: true, maxAge: 1})
                        res.status(401).send({response: 'unauthorized_admin', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
                    }
                }
            })
        }else{
            res.status(401).send({response: 'unauthorized_admin', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
        }
    } catch (error) {
        console.log(error)
        res.status(401).send({response: 'unauthorized_admin', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
    }
}

module.exports.CheckAuth = async (req, res, next) => {
    try {
        const token = req.cookies.admin_token
        if(token){
            jwt.verify(token, process.env.adminToken, async (err, decodedToken) =>{
                if(err){
                    res.cookie('admin_token', '', {httpOnly: true, maxAge: 1})
                    res.status(401).send({response: 'unauthorized_admin', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
                }else{
                    const admin = await Admin.findOne({
                        where: {
                            id: decodedToken.id
                        }
                    })
                    if(admin){
                        req.id= decodedToken.id
                        next()
                    }else{
                        res.cookie('admin_token', '', {httpOnly: true, maxAge: 1})
                        res.status(401).send({response: 'unauthorized_admin', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})    
                    }
                }
            })
        }else{
            res.status(401).send({response: 'unauthorized_admin', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
        }
    } catch (error) {
        console.log(error)
        res.status(401).send({response: 'unauthorized_admin', message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى'})
    }
}