module.exports = [
  //{
  //  "type": "heading",
  //  "defaultValue": "App Configuration",
  //},
  {
    "type": "text",
    "defaultValue": "Use Nightscout at your own risk, and do not use the information to make medical decisions.",
  },
  {
    "type": "section",
    "items": [
      {
        "type": "heading",
        "defaultValue": "Nightscout",
      },
      {
        "type": "input",
        "appKey": "NightscoutURL", // "messageKey": "NightscoutURL",
        "defaultValue": "https://mynightscout.azurewebsites.net",
        "label": "Nightscout website",
        "attributes": {
          "placeholder": "eg: https://mynightscout.azurewebsites.net",
          "type": "text",
        },
      },
      {
        "type": "select",
        "id": "selectNightscoutUnits",
        "appKey": "NightscoutUnits", // "messageKey": "NightscoutUnits",
        "defaultValue": "mmol",
        "label": "Units",
        "options": [
          { 
            "label": "mg/dL", 
            "value": "mg",
          },
          { 
            "label": "mmol/L",
            "value": "mmol",
          },
        ],
      },
    ],
  },
  {
    "type": "section",
    "items": [
      {
        "type": "heading",
        "defaultValue": "Levels",
      },
      {
        "type": "input",
        "id": "inputSetLow",
        "appKey": "SetLow", // "messageKey": "SetLow",
        "defaultValue": 4,
        "label": "Low threshold",
        "attributes": {
          "placeholder": "lowest in-range level",
          "type": "number",
        },
      },
      {
        "type": "input",
        "id": "inputSetHigh",
        "appKey": "SetHigh", // "messageKey": "SetHigh",
        "defaultValue": 7,
        "label": "High threshold",
        "attributes": {
          "placeholder": "lowest high level",
          "type": "number",
        },
      },
    ],
  }, 
  {
    "type": "section",
    "items": [
      {
        "type": "heading",
        "defaultValue": "General",
      },
      //{
      //  "type": "toggle",
      //  "appKey": "ShowClock", // "messageKey": "ShowClock",
      //  "label": "Display time",
      //  "defaultValue": false,
      //},
      {
        "type": "select",
        "id": "FormatClock",
        "appKey": "FormatClock", // "messageKey": "FormatClock",
        "defaultValue": "%H",
        "label": "Time format",
        "options": [
          { 
            "label": "None", 
            "value": "na",
          },
          { 
            "label": "12 hour", 
            "value": "%l",
          },
          { 
            "label": "24 hour",
            "value": "%H",
          },
        ],
      },
    ],
  },
  {
    "type": "submit",
    "defaultValue": "Save Settings",
  },
];