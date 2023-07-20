import JWT from 'jsonwebtoken';
import {User} from '@prisma/client'
import { JWTUser } from '../interfaces';

const secretKey = "shutup"

class JWTService{
    public static generateJWT(user:User){
        const payload:JWTUser = {
            id: user?.id,
            email: user?.email,
        }
        const token = JWT.sign(payload, secretKey);
        return token;
    }
    public static decodeJWT(token: string){
        try {
            return JWT.verify(token, secretKey) as JWTUser;
        } catch (error) {
            return null
        }
        
    }
}
export default JWTService;