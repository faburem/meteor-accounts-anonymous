# faburem:accounts-anonymous
Allow users to login anonymously (i.e. no username, email, password, or OAuth
service like accounts-google)

This is an opinionated fork of the brettle:accounts-anonymous package - it includes the add-service package out-of-the-box.
Besides including the add-service package, the code has been modernized and unneeded dependencies have been dropped (🪦 underscore).

Migrating from brettle:accounts-anoymous should be pretty straight forward, with only minor modifications needed to account for the move to modern ecmascript and modules.
This implies the minimal version of Meteor required to use this package is 1.2.

## Features
- Supports truly anonymous users
- Does not require accounts-password
- Fires server event when an anonymous user logs in as a different user
- Includes the add-service package to create permanent users e.g. using accounts-password to migrate anoymous to registered users easily
- Modern code and zero dependencies (besides Meteor's accounts-base)
## Installation
```sh
meteor add faburem:accounts-anonymous
```

## Usage

On the client, to login as a new anonymous user, call
`AccountsAnonymous.login([callback])`, while not logged in. The optional
`callback` runs with no arguments on success, or with a single `Error` argument
on failure. If the login was successful,  Meteor will have stored a "resume"
login token in the browser's localStorage which it will automatically send when
making future  connections to the server. This token allows the user to resume
as the same anonymous user as long as the token exists (i.e. the user hasn't
logged out or logged in as some other user), and hasn't
[expired](http://docs.meteor.com/#/full/accounts_config).

On the server, make sure to import the AccountsAnonymous package and initialize it.
`
import { AccountsAnonymous } from 'meteor/faburem:accounts-anonymous'
AccountsAnoymous.init()
`
On the server, call `AccountsAnonymous.onAbandoned(func)` to register a callback
to call if an anonymous user logs in as a different user. When this occurs,
Meteor replaces the anonymous user's token with the new user's token, so there
will be no way to log in again as the anonymous user. The `func` callback takes
the anonymous user as its sole argument. You might use the call back  to clean
up any data associated with the user.

## Migrating from brettle:accounts-anonymous
No changes should be needed on the client side other than changing the import from `brettle:accounts-anonymous` to `faburem:accounts-anonymous`.

### Breaking changes (server side)
If you have been using `brettle:accounts-anonymous` before you probably did not need any import on the server side because that has been handled automatically for you using side effects.
This has been changed to comply with modern JavaScript and thus you have to implicitly import and initialize the server side part of the package like so:

`
import { AccountsAnonymous } from 'meteor/faburem:accounts-anonymous'
AccountsAnoymous.init()
`

## Design and Usecase
This package can be used to support registration-free one-click on-boarding for your app. Let users explore all the features and if they like it they can opt-in to create a full account (e.g. username/email/password) later on.
An example of this usecase in action can be seen at [titra.io](https://titra.io). Specifically, there is a dedicated /try route which creates an anonymous user account. New users can explore the app and complete their profile whenever they feel ready to do so - or abandon it later on.

## History and Acknowledgements

This is a friendly fork of the great
[brettle:accounts-anonymous](https://github.com/brettle/meteor-accounts-anonymous)
package. The Meteor release 2.3 requires some changes to packages which are based 
on accounts-base and since the original package is not maintained anymore this friendly fork has been created!