import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {z} from 'zod'

import nodemailer from 'nodemailer'


import {dayjs} from '../lib/dayjs'
import { prisma } from "../lib/prisma";
import { getMailClient } from "../lib/mail";
import { ClientError } from "../errors/client-error";



export async function createTrip(app:FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().post('/trips', {
        schema: {
            body: z.object({
                destination:z.string().min(4),
                starts_at: z.coerce.date(),
                ends_at: z.coerce.date(),
                owner_name: z.string(),
                owner_email: z.string().email(),
                emails_to_invite:z.array(z.string().email()),
            })
        },
    }, async (req)=>{
        const {destination, starts_at, ends_at, owner_name, owner_email, emails_to_invite} = req.body

        if(dayjs(starts_at).isBefore(new Date())){
            throw new ClientError('Invalid trip start date')
        }
        if(dayjs(ends_at).isBefore(starts_at)){
            throw new ClientError('Invalid trip ends date')
        }


        const trip = await prisma.trip.create({
            data:{
                destination,
                starts_at,
                ends_at,
                participants:{
                    createMany:{
                        data:[
                            {
                                email:owner_email,
                                name: owner_name,
                                is_owner:true,
                                confirmed:true
                            },
                            ...emails_to_invite.map(email =>({
                                email,
                                name:''
                            }))
                        ],
                    }
                }
            }
        })

        const formatedStartDate = dayjs(starts_at).format('L')
        const formatedendDate = dayjs(ends_at).format('L')

        const mail = await getMailClient()

        const confirmationLink = `http://localhost:3333/trips/${trip.id}/confirm`

        const message = await mail.sendMail({
            from:{
                name: 'Equipe Plan.er',
                address:"eriicsouzaromeroo@gmail.com"
            }, 
            to:{
                name: owner_name,
                address:owner_email
            },
            subject:`Confirmação de viagem para ${destination} em ${formatedStartDate}`,
            html:`
                <div>
                    <p>Você, ${owner_name} solicitou uma viagem para ${destination} nas datas de ${formatedStartDate} até ${formatedendDate}</p>
                    <p>Para confirmar a viagem clique abaixo</p>
                        <a href"${confirmationLink}"> Confirmar viagem <a/>

                    <p>Caso não saiba do que se trata, apenas ignore este e-mail</p>
                </div>
            `.trim()
        })

        console.log(nodemailer.getTestMessageUrl(message))

        return {tripId: trip.id}
    }
)
}