import { Hook } from 'meteor/callback-hook'
import { Accounts } from 'meteor/accounts-base'
import AccountsMultiple from './accounts-multiple-server.js'
import AccountsAnonymous from './accounts-anonymous.js'
import AccountsAddService from './accounts-add-service-server.js'

function isAnonymous(user) {
  // A user is anonymous if they don't have any services other than "resume"
  return (user.services && user.services?.length === 1 && user.services.resume)
}

Accounts.registerLoginHandler('anonymous', async (options) => {
  if (!options || !options.anonymous || Meteor.userId()) {
    return undefined
  }

  const newUserId = await Accounts.insertUserDoc(options, {})
  return {
    userId: newUserId,
  }
})
AccountsAnonymous._onAbandonedHook = new Hook({
  bindEnvironment: false,
  debugPrintExceptions: 'AccountsAnonymous.onAbandoned callback',
})

AccountsAnonymous.onAbandoned = (func) => this._onAbandonedHook.register(func)

const callbackSet = {
  onSwitch(attemptingUser /* , attempt (unused) */) {
    if (isAnonymous(attemptingUser)) {
      AccountsAnonymous._onAbandonedHook.each((callback) => {
        callback(attemptingUser)
        return true
      })
    }
  },
}

AccountsAnonymous.init = () => {
  AccountsMultiple.register(callbackSet)
  AccountsAddService._init()
}

export { AccountsAnonymous }
