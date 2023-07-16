import JWT from 'jsonwebtoken';
import {User} from '@prisma/client'

const secretKey = 'shutup'

class JWTService{
    public static generateJWT(user:User){
        const payload = {
            id: user?.id,
            email: user?.email,
        }
        const token = JWT.sign(payload, secretKey);
        return token;
    }
}
export default JWTService;