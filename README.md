# ODS-Main

Main project for ODS. All related microservice projects for ODS are located in sub-directories.


## Run

Use `docker-compose up` to run all microservices in production mode.

Use `docker-compose -f docker-compose.yml -f docker-compose.ci.yml up <services>` for starting up specific services in development mode and intergation tests. See sub-directories for futher information.

## Getting Started

### Using API

You can finde example requests for the api under [doc/example-requests](./doc/example-requests).


# License

Copyright 2019 Friedrich-Alexander Universität Erlangen-Nürnberg

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see http://www.gnu.org/licenses/.

SPDX-License-Identifier: AGPL-3.0-only
