'use strict'

const { validateAll } = use('Validator')
const User = use('App/Models/User')
const randomString = require('random-string')
const Mail = use('Mail')

class RegisterController {
  showRegisterForm({view}){
    return view.render('auth.register')
  }

  async register ({request, session, response}){
    //validação pelos inputs
    const validation = await validateAll(request.all(), {
      username: 'required|unique:users,username',
      email: 'required|email|unique:users,email',
      password: 'required'
    })

    if(validation.fails()) {
      session.withErrors(validation.messages()).flashExcept(['password'])

      return response.redirect('back')
    }
    //criar usuário
    const user = await User.create({
      username: request.input('username'),
      email: request.input('email'),
      password: request.input('password'),
      confirmation_token: randomString({ length: 40 })
    })
    //enviar e-mail de confirmação
    await Mail.send('auth.emails.confirm_email', user.toJSON(), message => {
      message
        .to(user.email)
        .from('helo@adonisauth.com')
        .subject('Confirme seu endereço de e-mail')
    })
    //mostrar mensagem de sucesso
    session.flash({
      notification: {
        type: 'success',
        message: 'Registro efetuado com sucesso! Um email foi enviado e você deve confirmá-lo para ativar seu cadastro.'
      }
    })

    return response.redirect('back')
  }

  async confirmEmail({params,session,response}){
    //Pegando user com o token de confirmação
    const user = await User.findBy('confirmation_token', params.token)
    //Setando confirmação para NULL e transformando "is_active" para true
    user.confirmation_token = null
    user.is_active = true
    //Persistindo user no banco de dados
    await user.save()
    //Mostrando mensagem de sucesso
    session.flash({
      notification: {
        type: 'success',
        message: 'Seu email foi confirmado com sucesso!'
      }
    })

    return response.redirect('/login')

  }

}

module.exports = RegisterController
