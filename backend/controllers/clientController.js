import Client from "../models/clientModel.js"

export const createClient = async (req,res)=>{

    try{

        const client = new Client(req.body)

        await client.save()

        res.json(client)

    }catch(error){

        res.status(500).json({message:"Error al crear cliente"})

    }

}

export const getClients = async (req,res)=>{

    const clients = await Client.find()

    res.json(clients)

}

export const getClientById = async (req,res)=>{

    const client = await Client.findById(req.params.id)

    res.json(client)

}

export const updateClient = async (req,res)=>{

    const client = await Client.findByIdAndUpdate(
        req.params.id,
        req.body,
        {new:true}
    )

    res.json(client)

}

export const deleteClient = async (req,res)=>{

    await Client.findByIdAndDelete(req.params.id)

    res.json({message:"Cliente eliminado"})

}