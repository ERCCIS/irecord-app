import Morel from 'morel';
import App from '../../../app';
import log from '../../../helpers/log';
import appModel from '../../common/app_model';
import recordManager from '../../common/record_manager';
import Sample from '../../common/sample';
import Occurrence from '../../common/occurrence';
import MainView from './main_view';
import HeaderView from './header_view';

const API = {
  show() {
    recordManager.getAll((getError, recordsCollection) => {
      if (getError) {
        App.regions.dialog.error(getError);
        return;
      }

      // MAIN
      const mainView = new MainView({
        collection: recordsCollection,
        appModel,
      });

      mainView.on('childview:record:edit:attr', (childView, attr) => {
        App.trigger('records:edit:attr', childView.model.id || childView.model.cid, attr);
      });

      mainView.on('childview:record:delete', (childView) => {
        const recordModel = childView.model;
        const syncStatus = recordModel.getSyncStatus();
        let body = 'Are you sure you want to remove this record from your device?';

        if (syncStatus === Morel.SYNCED) {
          body += '</br><i><b>Note:</b> it will remain on the server.</i>';
        }
        App.regions.dialog.show({
          title: 'Delete',
          body,
          buttons: [
            {
              title: 'Cancel',
              onClick() {
                App.regions.dialog.hide();
              },
            },
            {
              title: 'Delete',
              class: 'btn-negative',
              onClick() {
                childView.model.destroy();
                App.regions.dialog.hide();
              },
            },
          ],
        });
      });
      App.regions.main.show(mainView);
    });

    // HEADER
    const headerView = new HeaderView();

    headerView.on('photo:upload', (e) => {
      // show loader
      API.photoUpload(e.target.files[0], () => {
        // hide loader
      });
    });

    // android gallery/camera selection
    headerView.on('photo:selection', () => {
      App.regions.dialog.show({
        title: 'Choose a method to upload a photo',
        buttons: [
          {
            title: 'Camera',
            onClick() {
              const options = {
                sourceType: window.Camera.PictureSourceType.CAMERA,
                destinationType: window.Camera.DestinationType.DATA_URL,
              };

              const onSuccess = (imageData) => {
                const fullImageData = `data:image/jpeg;base64,${imageData}`;
                API.photoUpload(fullImageData, () => {

                });
              };
              const onError = () => {
                log('Error capturing photo', 'e');
              };

              navigator.camera.getPicture(onSuccess, onError, options);
              App.regions.dialog.hide();
            },
          },
          {
            title: 'Gallery',
            onClick() {
              const options = {
                sourceType: window.Camera.PictureSourceType.PHOTOLIBRARY,
                destinationType: window.Camera.DestinationType.DATA_URL,
              };

              const onSuccess = (imageData) => {
                const fullImageData = `data:image/jpeg;base64,${imageData}`;
                API.photoUpload(fullImageData, (err) => {
                  if (err) {
                    App.regions.dialog.error(err);
                    return;
                  }
                });
              };
              const onError = () => {
                log('Error capturing photo', 'e');
              };

              navigator.camera.getPicture(onSuccess, onError, options);
              App.regions.dialog.hide();
            },
          },
        ],
      });
    });

    App.regions.header.show(headerView);

    // FOOTER
    App.regions.footer.hide().empty();
  },

  /**
   * Create new record with a photo
   */
  photoUpload(file, callback) {
    const occurrence = new Occurrence();

    // create and add new record
    const stringified = (err, data, fileType) => {
      Morel.Image.resize(data, fileType, 800, 800, (imgErr, image, imgData) => {
        if (imgErr) {
          App.regions.dialog.error(imgErr);
          return;
        }

        occurrence.images.set(new Morel.Image({
          data: imgData,
          type: fileType,
        }));

        const sample = new Sample(null, {
          occurrences: [occurrence],
        });

        // append locked attributes
        appModel.appendAttrLocks(sample);

        recordManager.set(sample, (saveError) => {
          if (saveError) {
            callback(saveError);
            return;
          }
          // check if location attr is not locked
          const locks = appModel.get('attrLocks');

          if (!locks.location) {
            // no previous location
            sample.startGPS();
          } else if (!locks.location.latitude || !locks.location.longitude) {
            // previously locked location was through GPS
            // so try again
            sample.startGPS();
          }
          callback();
        });
      });
    };

    if (file instanceof File) {
      Morel.Image.toString(file, stringified);
    } else {
      stringified(null, file, 'image/jpg');
    }
  },
};

export { API as default };
