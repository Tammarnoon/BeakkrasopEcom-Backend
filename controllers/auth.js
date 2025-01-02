const prisma = require('../config/prisma')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { token } = require('morgan')

exports.register = async(req, res)=>{
    try{
        const { email, password } = req.body

        //check e-mail required
        if(!email){
            //ไม่ผ่าน
            return res.status(400).json({ message : "Email is required" })
        }

        //check password required
        if(!password){
            //ไม่ผ่าน
            return res.status(400).json({ message : "Password is required" })
        }

        //check email duplicate in database
        const user = await prisma.user.findFirst({ 
            where: {
                email : email
            }
         })
        if(user){
            //ผ่าน
            return res.status(400).json({ message : "Email alreay exit" })
        }

        //HashPassword
        const HashPassword = await bcrypt.hash(password, 10)
        
        //register
        await prisma.user.create({ 
            data: {
                email : email,
                password : HashPassword
            }
         })

        
        res.send('Register Succesful')

    }catch(err){
        //show error
        console.log(err)
        res.status(500).json({ message : "server error" })
    }
}

exports.login = async(req,res) =>{
    try{
        const { email, password } = req.body

        //check email
        const user = await prisma.user.findFirst({ 
            where : {
                email: email

            }
         })
        if(!user || !user.enabled){
            return res.status(400).json({
                message: 'user not found or not enabled'
            })
        }

        //check password
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res.status(400).json({ message : 'password invalied' })
        }

        //create payload
        const payload = {
            id : user.id,
            email : user.email,
            role : user.role
        }

        //genarate token
        jwt.sign(payload, process.env.SECRET, { 
            expiresIn : '1d'

         }, (err, token)=> {
                if(err){
                    //error condition
                    return res.status(500).json({ message : "server error" })
                }
                //send token and user data
                res.json({ payload, token })

         })


    }catch(err){
        //show error
        console.log(err)
        res.status(500).json({ message : "server error" })
    }
}

exports.currentUser = async(req,res) =>{
    try{

        //import middleware
        const user = await prisma.user.findFirst({
            where : {
                email : req.user.email
            },
            select : {
                id : true,
                email : true,
                name : true,
                role : true
            }
        })

        res.json({user})

    }catch(err){
        //show error
        console.log(err)
        res.status(500).json({ message : "server error" })
    }
}

