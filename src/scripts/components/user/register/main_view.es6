/******************************************************************************
 * Welcome page view.
 *****************************************************************************/
define([
  'marionette',
  'log',
  'browser',
  'validate',
  'app',
  'JST'
], function (Marionette, Log, Browser, Validate, App, JST) {
  'use strict';

  var View = Marionette.ItemView.extend({
    template: JST['user/register/main'],

    events: {
      'click #register-button': 'register'
    },

    register: function (e) {
      //todo: add validation
      var data = {};

      let $emailInput  = this.$el.find('input[name=email]');
      let $passwordInput  = this.$el.find('input[name=password]');
      let $passwordConfInput = this.$el.find('input[name=password-confirm]');

      //user logins
      this.email = $emailInput.val(); //save it for future
      var firstname = this.$el.find('input[name=firstname]').val();
      var secondname = this.$el.find('input[name=secondname]').val();
      var password = $passwordInput.val();
      var passwordConfirm = $passwordConfInput.val();

      data.email = this.email;
      data.firstname = firstname;
      data.secondname = secondname;
      data.password = password;
      data['password-confirm'] = passwordConfirm;

      var active = $('#user-terms-agree').hasClass('active');
      data['terms-agree'] = active;

      this.trigger('form:submit', data);
    },

    onFormDataInvalid: function (errors) {
      var $view = this.$el;
      Validate.updateViewFormErrors($view, errors, "#user-");
    }
  });

  return View;
});
