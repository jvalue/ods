# ods-webclient

## Development Setup

We recomend to use [Visual Studio Code](https://code.visualstudio.com/) for development.

To ensure a consistent style you should use the following Visual Studio Code extension:

- Vetur: `ext install octref.vetur`
- TSLint Vue: `ext install prograhammer.tslint-vue`

To enable auto formating on save go to `File > Preference > Settings` and add the option `"editor.formatOnSave": true`.

## Running the webclient

To run the webclient, just execute `npm run serve` in the subprojects root directory (i.e. ui/). 
In order to communicate with the underlying microservices you need to create a .env file in the root directory (again ui/) and copy the contents of the .env.template file into it.