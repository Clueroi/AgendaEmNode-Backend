import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";

export async function confirmParticipant(app:FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().get(
        '/participants/:participantId/confirm',
        {
        schema: {
            params: z.object({
                participantId:z.string().uuid(),
            })
        },
    }, async (req, reply)=>{
        const {participantId} = req.params

       const participant = await prisma.participant.findUnique({
        where:{id:participantId}
       })

       if(!participant){
        throw new ClientError ('Participant not found')
       }

       if(participant.confirmed){
        return reply.redirect(`http://localhost:3000/trips/${participant.trip_id}`)
       }

       await prisma.participant.update({
        where:{id:participantId},
        data:{confirmed:true}
       })

        return reply.redirect(`http://localhost:3000/trips/${participant.trip_id}`)
    }
)
}