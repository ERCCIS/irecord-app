/******************************************************************************
 * Welcome page view.
 *****************************************************************************/
define([
  'marionette',
  'log',
  'validate',
  'JST'
], function (Marionette, Log, Validate, JST) {
  'use strict';

  var View = Marionette.ItemView.extend({
    template: JST['user/login/main'],

    events: {
      'click #login-button': 'login'
    },

    login: function (e) {
      var $inputPassword = this.$el.find('#user-password');
      var $inputEmail = this.$el.find('#user-email');

      let data = {
        email: $inputEmail.val(),
        password: $inputPassword.val()
      };

      this.trigger('form:submit', data);
    },

    onFormDataInvalid: function (errors) {
      var $view = this.$el;
      Validate.updateViewFormErrors($view, errors, "#user-");
    }
  });

  return View;
});
