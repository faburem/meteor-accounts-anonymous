import { Mongo } from 'meteor/mongo'
import { Promise } from 'meteor/promise'
import AccountsMultiple from './accounts-multiple-server.js'

const AccountsAddService = {}

AccountsAddService._mergeUserErrorReason = 'New login not needed. Service will be added to logged in user.'

export default AccountsAddService

const mergeUserErrorReason = AccountsAddService._mergeUserErrorReason

const OAuthEncryption = Package['oauth-encryption']
  && Package['oauth-encryption'].OAuthEncryption

AccountsAddService.databaseMigrationEnabled = true

AccountsAddService._migrationControl = new Mongo.Collection('AccountsAddService._migrationControl')

// returns false if the migration isn't run, or the number of users updated
// if it is.
AccountsAddService._migrateDatabase = async () => {
  if (!AccountsAddService.databaseMigrationEnabled) {
    return false
  }
  const addHasLoggedIn = await AccountsAddService._migrationControl.findOneAsync('addHasLoggedIn')
  if (addHasLoggedIn && addHasLoggedIn.startedAt) {
    return false
  }
  if (!addHasLoggedIn) {
    try {
      await AccountsAddService._migrationControl.insertAsync({ _id: 'addHasLoggedIn' })
    } catch (err) {
      // Ignore duplicate key error thrown if already id already exists due to
      // concurrent insertion attempts
      if (!(err.name === 'MongoError' && err.message.indexOf('E11000'))) {
        throw err
      }
    }
  }
  const numAffected = await AccountsAddService._migrationControl.updateAsync({
    _id: 'addHasLoggedIn',
    startedAt: { $exists: false },
  }, {
    $set: {
      startedAt: new Date(),
    },
  })
  // Only one server will return numAffected !== 0. When numAffect === 0,
  // The migration was already started (and possibly finished)
  if (numAffected === 0) {
    return false
  }

  const selector = {
    hasLoggedIn: { $exists: false },
    'services.resume': { $exists: true },
  }
  const numUsersUpdated =  await Meteor.users.updateAsync(selector, {
    $set: { hasLoggedIn: true },
  })
  if (numUsersUpdated > 0) {
    console.log(`faburem:accounts-add-service set hasLoggedIn = true for ${
      numUsersUpdated} existing user(s).`)
  }
  await AccountsAddService._migrationControl.updateAsync({
    _id: 'addHasLoggedIn',
  }, {
    $set: {
      finishedAt: new Date(),
    },
  })
  return numUsersUpdated
}

Meteor.startup(AccountsAddService._migrateDatabase)

// The first time a user logs in, we set his hasLoggedIn property so that
// we don't accidentally merge his account if his "resume" service is removed.
Accounts.onLogin(async (attemptInfo) => {
  if (attemptInfo.user && !attemptInfo.user.hasLoggedIn) {
    await Meteor.users.updateAsync(attemptInfo.user._id, {
      $set: { hasLoggedIn: true },
    })
  }
})

function isMergeable(user) {
  // A user should be merged if they have never logged in. If they have
  // never logged in, they won't have a "resume" service and they won't have
  // the `hasLoggedIn` property.
  return !(user.services && user.services.resume) && !(user.hasLoggedIn)
}

function repinCredentials(serviceData, oldUserId, newUserId) {
  Object.keys(serviceData).forEach((key) => {
    let value = serviceData[key]
    if (OAuthEncryption && OAuthEncryption.isSealed(value)) {
      value = OAuthEncryption.seal(OAuthEncryption.open(value, oldUserId), newUserId)
    }
    serviceData[key] = value
  })
}

const addServiceCallbackSet = {
  validateSwitch(attemptingUser, attempt) {
    if (isMergeable(attempt.user)) {
      throw new Meteor.Error(Accounts.LoginCancelledError.numericError,
        mergeUserErrorReason)
    }
    return true
  },
  async onSwitchFailure(attemptingUser, failedAttempt) {
    if (!failedAttempt.error
      || !failedAttempt.error.error || !failedAttempt.error.reason
      || failedAttempt.error.error !== Accounts.LoginCancelledError.numericError
      || failedAttempt.error.reason !== mergeUserErrorReason) {
      return
    }
    const serviceName = failedAttempt.type
    const serviceData = failedAttempt.user.services[serviceName]

    // Repin any pinned oauth credentials to the logged in user
    if (serviceName !== 'password' && serviceName !== 'resume') {
      repinCredentials(serviceData, failedAttempt.user._id, attemptingUser._id)
    }

    await Meteor.users.removeAsync(failedAttempt.user._id)

    // Copy the serviceData into Meteor.user.services[serviceName]
    const setAttrs = {}
    Object.entries(serviceData).forEach((value, key) => {
      setAttrs[`services.${serviceName}.${key}`] = value
    })

    // Non-destructively merge profile properties
    const attemptingProfile = attemptingUser.profile || {}
    let attemptProfile = failedAttempt.user.profile
    attemptProfile = Object.keys(attemptProfile)
      .filter((key) => Object.keys(attemptingProfile).indexOf(key) < 0)
      .reduce((newObj, key) => Object.assign(newObj, { [key]: attemptProfile[key] }), {})
    Object.entries(attemptProfile).forEach((value, key) => {
      setAttrs[`profile.${key}`] = value
    })

    // Non-destructively merge emails
    if (failedAttempt.user.emails) {
      const attemptingEmails = attemptingUser.emails || []
      const attemptEmails = failedAttempt.user.emails
      const mergedEmails = attemptingEmails.concat(attemptEmails)
      const uniqueEmails = []
      mergedEmails.forEach((entry) => {
        if (!uniqueEmails.find((search) => search.address === entry.address)) {
          uniqueEmails.push(entry)
        }
      })
      // mergedEmails = _.uniq(mergedEmails, false, (email) => email.address)
      setAttrs.emails = uniqueEmails
    }

    // Non-destructively merge email verification tokens
    if (failedAttempt.user.services
        && failedAttempt.user.services.email
        && failedAttempt.user.services.email.verificationTokens) {
      const attemptingTokens = (
        attemptingUser.services
        && attemptingUser.services.email
        && attemptingUser.services.email.verificationTokens
      ) || []
      const attemptTokens = failedAttempt.user.services.email.verificationTokens
      const mergedTokens = attemptingTokens.concat(attemptTokens)
      const uniqueTokens = []
      mergedTokens.forEach((entry) => {
        if (!uniqueTokens.find((search) => search.token === entry.token)) {
          uniqueTokens.push(entry)
        }
      })
      setAttrs['services.email.verificationTokens'] = mergedTokens
    }

    // Non-destructively merge top-level properties
    const attemptingTop = attemptingUser || {}
    const attemptTop = failedAttempt.user
    Object.keys(attemptTop)
      .filter((key) => Object.keys(attemptingTop).indexOf(key) < 0)
      .reduce((newObj, key) => Object.assign(newObj, { [key]: attemptingTop[key] }), {})
    delete attemptTop.profile // handled above
    delete attemptTop.emails // handled above
    delete attemptTop.services // handled above
    Object.entries(attemptTop).forEach((value, key) => {
      setAttrs[key] = value
    })

    await Meteor.users.updateAsync(attemptingUser._id, {
      $set: setAttrs,
    })
  },
}
AccountsAddService._init = () => {
  AccountsMultiple.register(addServiceCallbackSet)
}
