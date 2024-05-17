import Alpine from 'alpinejs'
import 'unpoly'

import 'unpoly/unpoly.css'

// Alpine
Alpine.start()

// Unpoly

if (document.querySelector('meta[name="mode"]')) {
  up.log.enable()
}

up.link.config.followSelectors.push('a[href]')
up.form.config.submitSelectors.push(['form'])
up.feedback.config.currentClasses.push(['active'])
up.feedback.config.navSelectors.push(['nav'])

up.layer.config.drawer.size = 'large'
up.layer.config.drawer.position = 'right'
