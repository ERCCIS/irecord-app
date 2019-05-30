/** ****************************************************************************
 * General survey configuration file.
 **************************************************************************** */
import $ from "jquery";
import Indicia from "indicia";
import DateHelp from "helpers/date";

const survey = {
  name: "default",
  id: 490,
  webForm: "enter-app-record",

  taxonGroups: [], // all

  editForm: ["occ:number", "occ:stage", "occ:identifiers"],

  attrs: {
    smp: {
      location: {
        values(location, submission) {
          // convert accuracy for map and gridref sources
          const accuracy = location.accuracy;
          const attributes = {};
          const keys = survey.attrs.smp;
          attributes.location_name = location.name; // this is a native indicia attr
          attributes[keys.location_source.id] = location.source;
          attributes[keys.location_gridref.id] = location.gridref;
          attributes[keys.location_altitude.id] = location.altitude;
          attributes[keys.location_altitude_accuracy.id] =
            location.altitudeAccuracy;
          attributes[keys.location_accuracy.id] = accuracy;

          // add other location related attributes
          $.extend(submission.fields, attributes);

          return `${location.latitude}, ${location.longitude}`;
        }
      },
      location_accuracy: { id: 282 },
      location_altitude: { id: 283 },
      location_altitude_accuracy: { id: 284 },
      location_source: { id: 760 },
      location_gridref: { id: 335 },

      device: {
        id: 273,
        values: {
          iOS: 2398,
          Android: 2399
        }
      },

      device_version: { id: 759 },
      app_version: { id: 1139 },

      date: {
        values(date) {
          return DateHelp.print(date);
        },
        isValid: val => val && val.toString() !== "Invalid Date",
        type: "date",
        max: () => new Date()
      },

      activity: {
        id: "group",
        values: activity => activity.id,
        type: "input"
      }
    },
    occ: {
      training: {
        id: "training"
      },

      taxon: {
        values(taxon) {
          return taxon.warehouse_id;
        }
      },
      number: {
        id: 93,
        info: "How many individuals of this type?",
        label: "Abundance",
        icon: "number"
      },
      "number-ranges": {
        id: 93,
        default: "Present",
        values: {
          1: 665,
          "2-5": 666,
          "6-20": 667,
          "21-100": 668,
          "101-500": 669,
          "500+": 670
        }
      },
      stage: {
        id: 218,
        info:
          "Please indicate the life stage and sex of the organism, if recorded.",
        default: "Not Recorded",
        values: {
          Male: 3484,
          "Pre-adult": 1951,
          Female: 3483,
          Other: 1952,
          Adult: 3405,
          "Adult male": 3406,
          "Adult female": 3407,
          Juvenile: 3408,
          "Juvenile male": 3409,
          "Juvenile female": 3410,
          "Breeding pair": 3411,
          "Mixed group": 5261,
          "In flower": 3412,
          Fruiting: 3413,
          Egg: 3956,
          Larva: 3957,
          Nymph: 3959,
          Spawn: 3960,
          Pupa: 3958,
          "Other (please add to comments)": 3414,
          "Not recorded": 3415
        },
        icon: "stage",
        type: "radio"
      },
      type: {
        id: 217,
        label: "Select the type of observation that was made.",
        default: "",
        values: {
          Seen: 3383,
          Heard: 3384,
          Dead: 3385,
          "Dead on road": 3386,
          "Feeding remains": 3387,
          "Dung or droppings": 3388,
          "Tracks or trail": 3389,
          Burrow: 3391,
          Nest: 3392,
          Colony: 5667,
          "Bat Roost": 3924,
          "Bat Hibernacula": 5294,
          "Bat Breeding Roost": 5296,
          "Bat Detected": 5299,
          "Bat Grounded": 7799,
          "Bat Seen": 5734,
          Trap: 5881,
          "Light trap": 3390,
          "Net trap": 5869,
          "Camera trap": 5870,
          "Other (please add to comments)": 3393
        },
        icon: "stage",
        type: "radio"
      },
      identifiers: {
        id: 18,
        info:
          "If anyone helped with the identification please enter their name here.",
        icon: "user-plus",
        type: "text"
      },
      comment: {
        info: "Please add any extra info about this record.",
        icon: "comment",
        type: "text"
      }
    }
  },
  verify(attrs) {
    const attributes = {};
    const occurrences = {};

    // todo: remove this bit once sample DB update is possible
    // check if saved or already send
    if (!this.metadata.saved || this.getSyncStatus() === Indicia.SYNCED) {
      attributes.send = false;
    }

    // location
    const location = attrs.location || {};
    if (!location.latitude) {
      attributes.location = "missing";
    }
    // location name
    if (!location.name) {
      attributes["location name"] = "missing";
    }

    // date
    if (!attrs.date) {
      attributes.date = "missing";
    } else {
      const date = new Date(attrs.date);
      if (date === "Invalid Date" || date > new Date()) {
        attributes.date =
          new Date(date) > new Date() ? "future date" : "invalid";
      }
    }

    // occurrences
    this.occurrences.each(occurrence => {
      const errors = occurrence.validate(null, { remote: true });
      if (errors) {
        const occurrenceID = occurrence.cid;
        occurrences[occurrenceID] = errors;
      }
    });

    return [attributes, null, occurrences];
  }
};

export default survey;
