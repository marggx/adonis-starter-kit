import type { HttpContext } from '@adonisjs/core/http'
import router from '@adonisjs/core/services/router'
import mail from '@adonisjs/mail/services/main'
import ForgotPasswordNotification from '#auth/mails/forgot_password_notification'
import User from '#core/models/user'
import UserPolicy from '#core/policies/user_policy'
import UserSessionFilter from '#admin/filters/user_session_filter'
import { inject } from '@adonisjs/core'
import { UserValidator } from '#admin/validators/user_validator'

@inject()
export default class UsersController {

  constructor(private userFilter: UserSessionFilter) {}

  async index(ctx: HttpContext) {
    const { view, bouncer } = ctx
    await bouncer.with(UserPolicy).authorize('viewList')

    const limit = 10
    const { page = 1, ...payload } = await this.userFilter.handle()

    const users = await User.filter(payload).orderBy('createdAt', 'desc').paginate(page, limit)
    users.baseUrl(router.builder().make('admin.users.index'))
    users.queryString(payload)

    return view.render('admin::pages/users/index', {
      users
    })
  }

  async create({ view, bouncer }: HttpContext) {
    await bouncer.with(UserPolicy).authorize('create')
    return view.render('admin::pages/users/create')
  }

  async store({ request, response, bouncer, session, i18n, auth, up }: HttpContext) {
    await bouncer.with(UserPolicy).authorize('create')
    // const avatar = request.file('avatar')!
    /**
     * validateUsing new user account creation form
     */
    const payload = await request.validateUsing(UserValidator, {
      meta: {
        currentUser: auth.user!,
      }
    })

    /**
     * Create a new user
     */
    const user = new User()
    await user.fill(payload)

    // if (avatar) {
    //   user.avatar = Attachment.fromFile(avatar)
    // }
    await user.save()

    // Event.emit('audit:new', {
    //   label: `Create user ${user!.fullname}`,
    //   username: auth.user!.fullname,
    //   userId: auth.user!.id,
    //   action: 'CREATE',
    //   target: 'USER',
    //   targetId: user.id,
    //   payload: user.serialize(),
    // })

    session.flash('notification', {
      type: 'success',
      message: i18n.formatMessage('form.success.user.create'),
    })

    if (up.isDrawer()) {
      up.setDismissLayer().commit()
    } else {
      response.redirect().toRoute('admin.users.index')
    }
  }

  async edit({ request, view, bouncer }: HttpContext) {
    const user = await User.findOrFail(request.param('id'))
    await bouncer.with(UserPolicy).authorize('update', user)

    user.password = ''

    return view.render('admin::pages/users/edit', {
      user,
    })
  }

  async update({ request, response, auth, bouncer, session, i18n, up }: HttpContext) {
    const user = await User.findOrFail(request.param('id'))

    await bouncer.with(UserPolicy).authorize('update', user)
    // const avatar = request.file('avatar')!

    const payload = await request.validateUsing(UserValidator, {
      meta: {
        currentUser: auth.user!,
        record: user
      }
    })

    await user.merge(payload)

    // if (avatar) {
    //   user.avatar = Attachment.fromFile(avatar)
    // }
    const dirty = user.$dirty
    const original = user.$original
    await user.save()

    // Event.emit('audit:new', {
    //   label: `Update user ${original!.firstname} ${original!.lastname}`,
    //   username: auth.user!.fullname,
    //   userId: auth.user!.id,
    //   action: 'UPDATE',
    //   target: 'USER',
    //   targetId: user.id,
    //   payload: dirty,
    // })

    session.flash('notification', {
      type: 'success',
      message: i18n.formatMessage('form.success.user.edit'),
    })

    if (up.getMode() === 'drawer') {
      up.setDismissLayer().commit()
    } else {
      if (auth.user?.isAdmin) {
        response.redirect().toRoute('admin.users.index')
      } else {
        response.redirect().toRoute('admin.dashboard')
      }
    }
  }

  async destroy({
    params,
    response,
    bouncer,
    session,
    i18n,
    auth,
    up,
  }: HttpContext) {
    const { id } = params
    const user = await User.findOrFail(id)
    await bouncer.with(UserPolicy).authorize('delete', user)
    const payload = user.serialize()
    const fullname = user!.fullname
    await user.delete()

    // Event.emit('audit:new', {
    //   label: `Delete user ${fullname}`,
    //   username: auth.user!.fullname,
    //   userId: auth.user!.id,
    //   action: 'DELETE',
    //   target: 'USER',
    //   targetId: id,
    //   payload,
    // })

    session.flash('notification', {
      type: 'success',
      message: i18n.formatMessage('form.success.user.delete'),
    })

    if (up.getMode() === 'drawer') {
      up.setDismissLayer().commit()
    } else {
      response.redirect().toRoute('admin.users.index')
    }
  }

  async toggleDisabled({
    request,
    response,
    bouncer,
    session,
    i18n,
    auth,
    up,
  }: HttpContext) {
    const user = await User.findOrFail(request.param('id'))
    await bouncer.with(UserPolicy).authorize('disabled', user)

    user.disabled = !user.disabled
    await user.save()

    if (user.disabled) {
      // Event.emit('audit:new', {
      //   label: `Disabled user ${user!.fullname}`,
      //   username: auth.user!.fullname,
      //   userId: auth.user!.id,
      //   action: 'UPDATE',
      //   target: 'USER',
      //   targetId: user.id,
      // })
      session.flash('notification', {
        type: 'success',
        message: i18n.formatMessage('form.success.user.toggle.disabled'),
      })
    } else {
      // Event.emit('audit:new', {
      //   label: `Enabled user ${user!.fullname}`,
      //   username: auth.user!.fullname,
      //   userId: auth.user!.id,
      //   action: 'UPDATE',
      //   target: 'USER',
      //   targetId: user.id,
      // })
      session.flash('notification', {
        type: 'success',
        message: i18n.formatMessage('form.success.user.toggle.enabled'),
      })
    }

    if (up.getMode() === 'drawer') {
      up.setDismissLayer().commit()
    } else {
      response.redirect().back()
    }
  }

  async forgotPassword({
    request,
    response,
    bouncer,
    session,
    i18n,
    auth,
    up,
  }: HttpContext) {
    const user = await User.findOrFail(request.param('id'))
    await bouncer.with(UserPolicy).authorize('forgot', user)

    if (user) {
      await mail.sendLater(new ForgotPasswordNotification(user))
    }

    // Event.emit('audit:new', {
    //   label: `Forgot password user ${user!.fullname}`,
    //   username: auth.user!.fullname,
    //   userId: auth.user!.id,
    //   action: 'UPDATE',
    //   target: 'USER',
    //   targetId: user.id,
    // })

    session.flash('notification', {
      type: 'success',
      message: i18n.formatMessage('form.success.user.forgot'),
    })

    if (up.getMode() === 'drawer') {
      up.setDismissLayer().commit()
    } else {
      response.redirect().back()
    }
  }
}
