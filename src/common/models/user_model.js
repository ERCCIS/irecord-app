/** ****************************************************************************
 * User model describing the user model on backend. Persistent.
 *****************************************************************************/
import _ from 'lodash';
import Backbone from 'backbone';
import Store from 'backbone.localstorage';
import Raven from 'raven-js';
import CONFIG from 'config';
import { Validate, Analytics } from 'helpers';
import activitiesExtension from './user_model_activities_ext';
import statisticsExtension from './user_model_statistics_ext';

let UserModel = Backbone.Model.extend({
  id: 'user',

  defaults: {
    drupalID: '',
    name: '',
    surname: '',
    email: '',
    password: '',

    activities: [],

    statistics: {
      synced_on: null,
      species: [],
      speciesRaw: [],
    },
  },

  localStorage: new Store(CONFIG.name),

  /**
   * Initializes the user.
   */
  initialize() {
    this.fetch();
    this.syncActivities();
    this.syncStats();

    this.setUpTracker();
  },

  /**
   * Resets the user login information.
   */
  logOut() {
    this.set('email', '');
    this.set('password', '');
    this.set('name', '');
    this.set('surname', '');

    this.resetActivities();
    this.resetStats();

    this.save();
    this.trigger('logout');
    Analytics.trackEvent('User', 'logout');
  },

  /**
   * Sets the app login state of the user account.
   * Saves the user account details into storage for permanent availability.
   *
   * @param user User object or empty object
   */
  logIn(user) {
    this.set('drupalID', user.id || '');
    this.set('password', user.password || '');
    this.set('email', user.email || '');
    this.set('name', user.firstname || '');
    this.set('surname', user.secondname || '');
    this.save();

    this.trigger('login');
    this.syncActivities();
    this.syncStats();
    Analytics.trackEvent('User', 'login');
  },

  /**
   * Returns user contact information.
   */
  hasLogIn() {
    return this.get('password');
  },

  getUser() {
    return this.get('email');
  },

  getPassword() {
    return this.get('password');
  },

  validateRegistration(attrs) {
    const errors = {};

    if (!attrs.email) {
      errors.email = "can't be blank";
    } else if (!Validate.email(attrs.email)) {
      errors.email = 'invalid';
    }

    if (!attrs.firstname) {
      errors.firstName = "can't be blank";
    }

    if (!attrs.secondname) {
      errors.secondname = "can't be blank";
    }

    if (!attrs.password) {
      errors.password = "can't be blank";
    } else if (attrs.password.length < 2) {
      errors.password = 'is too short';
    }

    if (!attrs['password-confirm']) {
      errors['password-confirm'] = "can't be blank";
    } else if (attrs['password-confirm'] !== attrs.password) {
      errors['password-confirm'] = 'passwords are not equal';
    }

    if (!attrs['terms-agree']) {
      errors['terms-agree'] = 'you must agree to the terms';
    }

    if (!_.isEmpty(errors)) {
      return errors;
    }

    return null;
  },

  validateLogin(attrs) {
    const errors = {};

    if (!attrs.email) {
      errors.email = "can't be blank";
    } else if (!Validate.email(attrs.email)) {
      errors.email = 'invalid';
    }

    if (!attrs.password) {
      errors.password = "can't be blank";
    }

    if (!_.isEmpty(errors)) {
      return errors;
    }

    return null;
  },

  setUpTracker() {
    const that = this;

    function setUserContext() {
      if (that.hasLogIn()) {
        Raven.setUserContext({
          email: that.get('email'),
        });
      } else {
        Raven.setUserContext({ email: null });
      }
    }

    this.on('login logout', setUserContext);
    setUserContext();
  },
});

// add activities management
UserModel = UserModel.extend(activitiesExtension);

// add statistics management
UserModel = UserModel.extend(statisticsExtension);

const userModel = new UserModel();
export { userModel as default, UserModel };
