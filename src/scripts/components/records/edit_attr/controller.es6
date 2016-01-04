define([
  'app',
  'common/user_model',
  './main_view',
  'common/header_view',
  './lock_view',
  'common/record_manager',
  'helpers/date_extension'
], function (app, user, MainView, HeaderView, LockView, recordManager) {
  let API =  {
    show: function (recordID, attr) {
      recordManager.get(recordID, function (err, record) {
        if (!record) {
          app.trigger('404:show');
          return;
        }

        let occ = record.occurrences.at(0);
        let templateData = new Backbone.Model();
        switch (attr) {
          case 'date':
            templateData.set('date', record.get('date').toDateInputValue())
            break;
          case 'number':
            templateData.set(occ.get('number'), true);
            break;
          case 'stage':
            templateData.set(occ.get('stage'), true);
            break;
          case 'comment':
            templateData.set('comment', occ.get('comment'));
            break;
          default:
            app.trigger('404:show');
            return;
        };

        //can't edit a saved one - to be removed when record update
        //is possible on the server
        if (record.metadata.saved) {
          app.trigger('records:show', recordID);
          return;
        }

        //MAIN
        let mainView = new MainView({
          attr: attr,
          model: templateData
        });
        app.regions.main.show(mainView);

        let onExit = function () {
          let values = mainView.getValues();
          switch (attr) {
            case 'date':
              record.set('date', values.date);
              break;
            case 'number':
              occ.set('number', values.number);
              break;
            case 'stage':
              occ.set('stage', values.stage);
              break;
            case 'comment':
              occ.set('comment', values.comment);
              break;
            default:
          }
          recordManager.set(record, function () {
            //update locked value if attr is locked
            if (user.getAttrLock(attr)) {
              user.setAttrLock(attr, values);
            }

            window.history.back();
          })
        };

        //HEADER
        let lockView = new LockView({
          model: user
        });
        let headerView = new HeaderView({
          onExit: onExit,
          rightPanel: lockView
        });

        lockView.on('lockClick', function () {
          //save the lock of the attribute
          let value = null;
          if (!user.getAttrLock(attr)) {
            switch (attr) {
              case 'date':
                value = record.get('date');
                break;
              case 'number':
                value = occ.get('number');
                break;
              case 'stage':
                value = occ.get('stage');
                break;
              case 'comment':
              /*fallthrough*/
              default:
                return;
            };
          }

          user.setAttrLock(attr, value);
        });


        app.regions.header.show(headerView);

        //if exit on selection click
        mainView.on('save', onExit);
      });
    }
  };

  return API;
});