migrate(
  (app) => {
    var campCol = app.findCollectionByNameOrId('campaigns')

    var seeds = [
      { name: 'Grupos WhatsApp', slug: 'wpp-groups', source: 'whatsapp', medium: 'social' },
      {
        name: 'Influencer Maria',
        slug: 'influencer-maria',
        source: 'influencer',
        medium: 'social',
      },
      { name: 'Google Ads', slug: 'google-ads-01', source: 'google', medium: 'cpc' },
    ]

    for (var i = 0; i < seeds.length; i++) {
      try {
        app.findFirstRecordByData('campaigns', 'slug', seeds[i].slug)
      } catch (_) {
        var r = new Record(campCol)
        r.set('name', seeds[i].name)
        r.set('slug', seeds[i].slug)
        r.set('source', seeds[i].source)
        r.set('medium', seeds[i].medium)
        r.set('visit_count', 0)
        r.set('registration_count', 0)
        app.save(r)
      }
    }
  },
  (app) => {
    var slugs = ['wpp-groups', 'influencer-maria', 'google-ads-01']
    for (var i = 0; i < slugs.length; i++) {
      try {
        var r = app.findFirstRecordByData('campaigns', 'slug', slugs[i])
        app.delete(r)
      } catch (_) {}
    }
  },
)
