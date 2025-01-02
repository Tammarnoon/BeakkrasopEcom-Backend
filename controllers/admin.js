const { empty } = require("@prisma/client/runtime/library")
const prisma = require("../config/prisma")

exports.changeOrderStatus = async(req,res) =>{
    try{

        const { orderId, orderStatus } = req.body
        const orderUpdtate = await prisma.order.update({
            where : {
                id : orderId
            },

            data : {
                orderStatus : orderStatus
            }
        })


        res.json("Order Status changed")

    }catch(err){
        //show error
        console.log(err)
        res.status(500).json({ message : "server error" })
    }
}

exports.getOrderAdmin = async(req,res) =>{
    try {
        const orders = await prisma.order.findMany({
            include: {
                products: {
                    include: {
                        product: true
                    }
                },
                orderedBy: {
                    select: {
                        id: true,
                        email: true,
                        address : true
                    }
                }
            }
        });

        res.json(orders);

    }catch(err){
        //show error
        console.log(err)
        res.status(500).json({ message : "server error" })
    }
}