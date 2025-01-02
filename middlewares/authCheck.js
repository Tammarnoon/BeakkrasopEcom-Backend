const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')

exports.authCheck = async(req,res,next)=>{
    try{

        //token check
        const headerToken = req.headers.authorization
        if(!headerToken){
            return res.status(401).json({ message : "There's no token Authorization" })
        }
        const token = headerToken.split(" ")[1]
  
        //token verfiy
        const decode = jwt.verify(token, process.env.SECRET)
        req.user = decode
        
        //user list
        const user = await prisma.user.findFirst({
            where : {
                email : req.user.email
            }
        })

        //enable check
        if(!user.enabled){
            return res.status(400).json({ message : "This account cannot access"})
        }

        next()

    }catch(err){
        //show error
        console.log(err)
        res.status(500).json({ message : "Token Invalid" })
    }
}

exports.adminCheck = async(req,res,next)=>{
    try{

        const { email } =  req.user
        const adminUser = await prisma.user.findFirst({
            where : { email : email }
        })

        //Admin role check
        if(!adminUser || adminUser.role !== 'admin'){
            res.status(500).json({ message : "Access denied : Admin only" })
        }

        next()

    }catch(err){
        //show error
        console.log(err)
        res.status(500).json({ message : "Error Admin access denied" })
    }

}