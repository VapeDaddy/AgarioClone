const LocalStrategy = require('passport-local').Strategy //use local strategy: email + password
const bcrypt = require('bcrypt')

function initialize(passport, getUserByEmail, getUserById) {
    //check username and password 
    const authenticateUser = async(email, password, done) => {
        const user = getUserByEmail(email)
        await user
        user.then(async(user) => {           
            if (user == null) {
                return done(null, false, { message: 'No user with that email' })

            } else {
                try {
                    let match = await bcrypt.compare(password, user.Password) 
                    if (match === true) {
                        return done(null, user)
                    } else {
                        return done(null, false, { message: 'Password incorrect' })
                    }
                } catch (e) {
                    return done(e)
                }
            }
        });
    }

    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => {
        return done(null, getUserById(id))
    })
}

module.exports = initialize