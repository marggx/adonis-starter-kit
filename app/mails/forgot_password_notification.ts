import i18nManager from '@adonisjs/i18n/services/main'
import router from '@adonisjs/core/services/router'
import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import User from '#models/user'

export default class ForgotPasswordNotification extends BaseMail {
  constructor(private user: User) {
    super()
  }

  prepare() {
    const i18n = i18nManager.locale(i18nManager.defaultLocale)
    const url = router.builder()
      .prefixUrl(env.get('APP_URL'))
      .params({ email: this.user.email })
      .makeSigned('auth.password.reset.create', {
        expiresIn: '1h',
      })

    this.message
      .from(env.get('EMAIL_FROM'), 'Adonis')
      .to(this.user.email, this.user.fullname)
      .subject(i18n.formatMessage('email.forgotPassword.subject'))
      .htmlView('emails/auth/forgot-password', {
        user: this.user,
        url,
      })
  }
}
