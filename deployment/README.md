# Kubernetes Deployment Files
The deployment directory contains all files needed to deploy the ODS to a Kubernetes cluster.
The scripts in this directory are used as part of the CI.

## Current Features
* Generate deployment files for different namespaces and urls.
* Deploy a new ODS instance to Kubernetes
* Undeploy ODS instances

## Planned Features
* Rolling updates
* Persistent volumes for databases
* Scaling

## Getting Started
In order to deploy to Kubernetes, kubectl must be installed and configured with a Kubernetes cluster.
1. Use the `generate-kubernetes-files.py` script to create Kubernetes files from given templates.  
The script should be used as follows:
    ```
      usage: generate-kubernetes-files.py [-h] [--output_dir OUTPUT_DIR]
                                          [--template_dir TEMPLATE_DIR]
                                           namespace base_url
    ```
    This script reads the template files and replaces the variables for namespace and base url before saving the files in the output directory.

3. Run the `deploy.sh` script.
    ```
    deploy.sh [-h] [-i input_dir] namespace -- Script to deploy Kubernetes files to a new namespace.

    where:
        -h  show this help text
        -i  set the input directory for kubernetes files(default: ./)
    ```
   This script takes the previously generated Kubernetes files and deploys them.  
   This contains the following steps:
    * Recreate the namespace to create a new clean environment
    * Copy the registry secrets from the `ods` namespace to the new namespace.
    * Deploy to Kubernetes
