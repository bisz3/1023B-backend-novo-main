import  jwt from 'jsonwebtoken'

export const generateToken = (user: any) => {
    return jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
        expiresIn: '1h',
    })
}

export const verifyToken = (token: string) => {
    return jwt.verify(token, process.env.JWT_SECRET!)
}
