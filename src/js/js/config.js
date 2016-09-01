module.exports = [
  {
    "type": "heading",
    "defaultValue": "App Configuration",
  },
  {
    "type": "text",
    "defaultValue": "Nightscout Jr is an interface to Nightscout (www.nightscout.info).",
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
        "messageKey": "NightscoutURL",
        "defaultValue": "https://.azurewebsites.net",
        "label": "Nightscout URL",
        "attributes": {
          "placeholder": "eg: https://mynightscout.azurewebsites.net",
          "type": "text",
        },
      },
      {
        "type": "select",
        "messageKey": "NightscoutUnits",
        "defaultValue": "mg",
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
        "messageKey": "SetLow",
        "defaultValue": 72,
        "label": "Low threshold",
        "attributes": {
          "placeholder": "lowest in-range level",
          "type": "number",
        },
      },
      {
        "type": "input",
        "messageKey": "SetHigh",
        "defaultValue": 135,
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
      {
        "type": "toggle",
        "messageKey": "showClock",
        "label": "Display time",
        "defaultValue": false,
      },
    ],
  },
  {
    "type": "submit",
    "defaultValue": "Save Settings",
  },
];