const prisma = require("../config/prisma")

exports.create = async(req,res) =>{
    try{
        const { name } = req.body
        const category = await prisma.category.create({
            data : {
                name : name
            }
        })

        res.send(category)

    }catch(err){
        //show error
        console.log(err)
        res.status(500).json({ message : "server error" })
    }
}

exports.list = async(req,res) =>{
    try{

        const category = await prisma.category.findMany()
        res.send(category)
    }catch(err){
        //show error
        console.log(err)
        res.status(500).json({ message : "server error" })
    }
}

exports.remove = async(req,res) =>{
    try{
        const { id } = req.params
        const category = await prisma.category.delete({
            where : {
                id : Number(id)
            }
        })

        res.send(category)
        
    }catch(err){
        //show error
        console.log(err)
        res.status(500).json({ message : "server error" })
    }
}

