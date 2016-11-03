/** ****************************************************************************
 * User router.
 *****************************************************************************/
import Marionette from 'marionette';
import App from '../../app';
import Log from '../../helpers/log';
import LoginController from './login/controller';
import RegisterController from './register/controller';
import ActivitiesController from '../common/pages/activities/controller';
import StatisticsController from './statistics/controller';

App.user = {};

const Router = Marionette.AppRouter.extend({
  routes: {
    'user/login(/)': LoginController.show,
    'user/activities(/)': ActivitiesController.show,
    'user/statistics(/)': StatisticsController.show,
    'user/register(/)': RegisterController.show,
    'user/*path': function () { App.trigger('404:show'); },
  },
});

App.on('user:login', (options) => {
  App.navigate('user/login', options);
  LoginController.show();
});

App.on('user:register', (options) => {
  App.navigate('user/register', options);
  RegisterController.show();
});

App.on('user:activities', (options) => {
  App.navigate('user/activities', options);
  ActivitiesController.show();
});

App.on('user:statistics', (options) => {
  App.navigate('user/statistics', options);
  StatisticsController.show();
});

App.on('before:start', () => {
  Log('User:router: initializing');
  App.user.router = new Router();
});
