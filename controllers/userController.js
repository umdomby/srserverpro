const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
//const {User, Basket} = require('../models/models')
const Registration = require('../models/Registrations');

const generateJwt = (email, role) => {
    return jwt.sign(
        {email, role},
        process.env.SECRET_KEY,
        {expiresIn: '24h'}
    )
}

class UserController {

    async registration(req, res, next) {
        const {email, password, role} = req.body
        if (!email || !password) {
            return next(ApiError.badRequest('Некорректный email или password'))
        }
        const candidate = await Registration.findOne({email: email})
        if (candidate) {
            return next(ApiError.badRequest('Пользователь с таким email уже существует'))
        }
        const hashPassword = await bcrypt.hash(password, 5)
        const user = new Registration( {email: email, role: role, password: hashPassword});
        await user.save();
        const token = generateJwt(email, role)
        return res.json({token})
    }

    async login(req, res, next) {
        const {email, password} = req.body
        const user = await Registration.findOne({email: email})
        if (!user) {
            return next(ApiError.internal('Пользователь не найден'))
        }
        let comparePassword = bcrypt.compareSync(password, user.password)
        if (!comparePassword) {
            return next(ApiError.internal('Указан неверный пароль'))
        }
        const token = generateJwt(user.email, user.role)
        return res.json({token})
    }

    async check(req, res, next) {
        const token = generateJwt(req.user.email, req.user.role)
        return res.json({token})
    }
}

module.exports = new UserController()
