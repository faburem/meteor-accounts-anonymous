Package.describe({
  summary: "Support anonymous logins",
  version: "0.2.0",
  name: "brettle:accounts-anonymous",
  git: "https://github.com/brettle/meteor-accounts-anonymous.git"
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.4');
  api.use(['accounts-base'], 'client');
  api.use(['accounts-base', 'callback-hook'], 'server');
  api.use('underscore', 'server');
  api.use('brettle:accounts-multiple@0.0.1', 'server');
  api.add_files('accounts-anonymous.js', ['client', 'server']);
  api.export('AccountsAnonymous');
  api.add_files('accounts-anonymous-server.js', 'server');
  api.add_files('accounts-anonymous-client.js', 'client');
});

Package.onTest(function(api) {
  api.versionsFrom('1.0.4');
  api.use(['brettle:accounts-anonymous@0.1.0', 'accounts-base', 'tinytest'], ['client', 'server']);
  api.use('brettle:accounts-multiple@0.1.0');
  api.use('accounts-password', 'server');
  api.use('ddp', 'server');
  api.add_files('accounts-anonymous-server-tests.js', 'server');
  api.add_files('accounts-anonymous-client-tests.js', 'client');
});
