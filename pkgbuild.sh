#!/bin/bash

echo 'Build stared'

#prepare www source
npm install
grunt cordova

#init cordova source
echo 'Initializing cordova'
cordova create cordova com.ceh.irecord iRecord

#add www source to cordova
echo 'Moving dist to cordova'
rm -R cordova/www/*
cp -R dist/* cordova/www/ 

cd cordova
cordova platforms add ios android

cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-console
cordova plugin add cordova-plugin-geolocation
cordova plugin add cordova-plugin-network-information
cordova plugin add ionic-plugin-keyboard
cordova plugin add ionic-plugin-statusbar

