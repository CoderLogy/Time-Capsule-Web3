import { PinataSDK } from "pinata"
import "dotenv/config"

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY
})

async function uploadCapsule(text:string) {
    const res = await pinata.upload.public.json({
        message: text,
        createdAt: Date.now()
    });
    console.log( `ipfs://${res.cid}`)
}
uploadCapsule("hello from other side of world")
