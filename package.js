Package.describe({
  summary: 'Support anonymous logins',
  version: '0.5.0',
  name: 'faburem:accounts-anonymous',
  git: 'https://github.com/faburem/meteor-accounts-anonymous.git',
})

Package.onUse((api) => {
  api.versionsFrom('2.16')
  api.use(['accounts-base'], 'client')
  api.use(['accounts-base', 'callback-hook'], 'server')
  api.use(['ecmascript'], ['client', 'server'])
  api.mainModule('accounts-anonymous-client.js', 'client', { lazy: true })
  api.mainModule('accounts-anonymous-server.js', 'server', { lazy: true })
})

// Package.onTest((api) => {
//   api.versionsFrom(['1.2', '2.3'])
//   api.use(['faburem:accounts-anonymous@0.1.0', 'accounts-base', 'tinytest'],
//     ['client', 'server'])
//   api.use('accounts-password', 'server')
//   api.use('ddp', 'server')
//   api.addFiles('accounts-anonymous-server-tests.js', 'server')
//   api.addFiles('accounts-anonymous-client-tests.js', 'client')
// })
