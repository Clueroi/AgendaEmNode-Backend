import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {z} from 'zod'

import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";




export async function getParticipant(app:FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().get('/participant/:participantId', {
        schema: {
            params:z.object({
                participantId:z.string().uuid()
            }),
           
        },
    }, async (req)=>{
        const {participantId} = req.params

        const participant = await prisma.participant.findUnique({
            select:{
                id:true,
                email:true,
                name:true,
                confirmed:true,
            },
            where:{id:participantId},
           
        })

        if(!participantId){
            throw new ClientError('participant not found')
        }

        


       
        return {participant}
    }
)
}