# Example Requests for the ODS microservices
The .http files in this directory (and its subdirs) contain example requests for the ods. 
Each microservice has a separate .http file with requests that demonstrate how its API is to be used. 

The requests in the subdirectories are examples for the configuration of entire pipelines. 
Each one of these examples contains requests to multiple ods microservices.

## Usage
Lines starting with ``@`` define constants that can be accessed by ``{{}}``-syntax.
### [Recommended] Visual Studio Code
* Install the _REST Client_ extension (File -> Settings -> Extensions). 
* After succesfull installation, a ``send request`` button should appear on top of each example request in the .http file. 
* Perform the request by clicking this button.
### Postman, cURL etc.
* copy/paste the requests to use it in your tool of choice.
* The first line contains the HTTP request method, followed by the request url and the HTTP version. 
* Following lines contain colon-separated header fields
* If the request contains a body, this is located at the end of the example request (usually a JSON Object)   
