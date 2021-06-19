import { Accounts } from 'meteor/accounts-base'
import AccountsAnonymous from './accounts-anonymous.js'

AccountsAnonymous.login = (callback) => {
  callback = callback || (() => {})
  if (Meteor.userId()) {
    callback(new Meteor.Error(AccountsAnonymous._ALREADY_LOGGED_IN_ERROR,
      "You can't login anonymously while you are already logged in."))
    return
  }
  Accounts.callLoginMethod({
    methodArguments: [{
      anonymous: true,
    }],
    userCallback(error) {
      if (error) {
        if (callback) { callback(error) }
      } else if (callback) { callback() }
    },
  })
}

export { AccountsAnonymous }
