import { DateTime } from 'luxon'
import { HttpContext } from '@adonisjs/core/http'
import User from '#core/models/user'

export default class SessionController {
  async create({ view }: HttpContext) {
    return view.render('auth::pages/auth/login')
  }

  async store({ request, auth, session, i18n, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    const user = await User.verifyCredentials(email, password)

    await auth.use('web').login(user, !!request.input('remember_me'))

    if (user?.disabled) {
      session.flash('notification', {
        type: 'error',
        message: i18n.formatMessage('auth.E_INVALID_DISABLED')
      })
      session.clear()
      return response.redirect('/auth/login')
    }

    user.lastLoginAt = DateTime.local()
    await user.save()

    session.flash('notification', {
      type: 'success',
      message: i18n.formatMessage('form.success.session'),
    })

    response.redirect('/')
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    response.redirect('/auth/login')
  }
}
