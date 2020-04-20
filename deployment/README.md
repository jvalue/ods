# Kubernetes Deployment Files
The deployment directory contains all files needed to deploy the ODS to a Kubernetes cluster.

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

## Deployment Evironment (Kubernetes) Setup

### Micro-K8s Setup on Server

Do the following steps on a fresh Ubuntu Server installation:
1. Run the `iptables-config.sh`  script, in <some script: TODO>

2. Check if the firewall behaviour is correct and persist settings with:
	```
	echo "iptables-save > /etc/iptables/rules.v4"
	echo "ip6tables-save > /etc/iptables/rules.v6"
	```

3. Install latest microk8s

	```
	snap install microk8s --classic
	```

4. [Optional] Alias microk8s.kubectl to kubectl (This saves some writing and makes following Kubernetes examples easier).

	```
	snap alias microk8s.kubectl kubectl
	```

5. Enable DNS, Dashboard and Ingress Addons

	```
	microk8s.enable dns dashboard ingress
	```

6. Check if everything worked with

	```
	microk8s.status
	```
### Create service accounts and access the cluster via remote connection
This tutorial is based on [this one](http://docs.shippable.com/deploy/tutorial/create-kubeconfig-for-self-hosted-kubernetes-cluster/).
1. Create Service Accounts
	```
	kubectl apply -f - <<EOF
	apiVersion: v1
	kind: ServiceAccount
	metadata:
	  name: <replace with your desired account name>
	EOF
	```
2. Check if service account was created
	```
	kubectl get serviceaccounts/<replace with your account name> -o yaml
	```
3. Fetch the name of your secret
	```
	kubectl describe serviceAccounts
	```
	Note down the  `Mountable secrets`  information of your account, which has the name of the secret that holds the token
	
4. Get the token for your service account
	```
	kubectl describe secrets <replace with your secret>
	```
	Note down the `TOKEN` value
5. In the next step you have to retrieve the cluster information. To do so, execute the following:
	```
	kubectl config view --flatten --minify > cluster-cert.txt  
	cat cluster-cert.txt
	```
	Note down the `server` and `certificate-authority-data` values.

For the next steps you need to have `kubectl` installed on your machine.

6. Create a  `$HOME/.kube/config` file on your machine with the following content:
	```
	apiVersion: v1  
	kind: Config  
	users:  
	- name: <replace this with your user name>  
		user:  
			token: <replace  this  with token  info>  
	clusters:  
	- cluster:
		certificate-authority-data: <replace this with certificate-authority-data info>  
		server: <replace this with server info>  
	  name: ods-deployment-cluster
   contexts:  
   - context:  
	   cluster: ods-deployment-cluster
	   user: <replace with your user name>  
	 name: ods-deployment-context  
   current-context: ods-deployment-context
	```
7.  Save and load the new context with the following command:
	```
	kubectl config --kubeconfig=$HOME/.kube/config set-context ods-deployment-context
	```
8. Test if everything worked by running
					
		kubectl --version
				

### Connect to the dashboard

The recommended way to connect to the dashboard is to use a proxy to connect to the api server.

Run `kubectl proxy --port=8080` to start the proxy. Now kubectl takes care authenticating the proxy at the api server, to allow a secure communication over https.

Now you can reach the dashboard from the machine that runs the proxy under [this link](http://localhost:8080/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/).

You need to login to the dashboard with your service account data.


```
