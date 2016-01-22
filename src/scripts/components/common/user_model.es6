/******************************************************************************
 * User model describing the user model on backend. Persistent.
 *****************************************************************************/
define([
  'backbone',
  'backbone.localStorage',
  'app-config'
], function (Backbone, Store, CONFIG) {
  'use strict';

  var User = Backbone.Model.extend({
    id: 'user',

    defaults: {
      name: '',
      surname: '',
      email: '',
      secret: ''
    },

    localStorage: new Store(CONFIG.name),

    /**
     * Initializes the user.
     */
    initialize: function () {
      this.fetch();
    },

    /**
     * Resets the user login information.
     */
    logOut: function () {
      this.set('email', '');
      this.set('secret', '');
      this.set('name', '');
      this.set('surname', '');
      this.save();
      this.trigger('logout');
    },

    /**
     * Sets the app login state of the user account.
     * Saves the user account details into storage for permanent availability.
     *
     * @param user User object or empty object
     */
    logIn: function (user) {
      this.set('secret', user.secret || '');
      this.setContactDetails(user);
      this.save();
      this.trigger('login');
    },

    /**
     * Sets user contact information.
     */
    setContactDetails: function (user) {
      this.set('email', user.email || '');
      this.set('name', user.name || '');
      this.set('surname', user.surname || '');
      this.save();
    },

    /**
     * Returns user contact information.
     */
    hasLogIn: function () {
      return this.get('secret');
    },

    appendSampleUser: function (sample) {
      sample.set('name', this.get('name') || '_');
      sample.set('surname', this.get('surname') || 'Test');
      sample.set('email', this.get('email') || 'test@test.com');
      //sample.set('secret', this.get('secret'));

      return sample;
    }
  });

  return new User();
});