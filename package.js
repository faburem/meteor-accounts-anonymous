Package.describe({
  summary: 'Support anonymous logins',
  version: '0.5.8',
  name: 'faburem:accounts-anonymous',
  git: 'https://github.com/faburem/meteor-accounts-anonymous.git',
})

Package.onUse((api) => {
  api.versionsFrom(['2.16', '3.0'])
  api.use(['accounts-base'], 'client')
  api.use(['accounts-base', 'callback-hook'], 'server')
  api.use(['ecmascript'], ['client', 'server'])
  api.mainModule('accounts-anonymous-client.js', 'client', { lazy: true })
  api.mainModule('accounts-anonymous-server.js', 'server', { lazy: true })
})
