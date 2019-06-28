# ods-webclient

## Development Setup

We recomend to use [Visual Studio Code](https://code.visualstudio.com/) for development.

To ensure a consistent style you should use the following Visual Studio Code extension:

- Vetur: `ext install octref.vetur`
- TSLint Vue: `ext install prograhammer.tslint-vue`

To enable auto formating on save go to `File > Preference > Settings` and add the option `"editor.formatOnSave": true`.

## Preparations for running

Copy the `.env.template` file as a `.env` file and adjust the urls for the other microservices in case they are different for your setup. For local development work the defaults should be accurate.

Use `npm install` to install all dependencies.

## Running the webclient

To run the webclient, just execute `npm run serve` in the subprojects root directory (i.e. ui/). 
