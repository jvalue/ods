#!/bin/sh

usage="$(basename "$0") [-h] [-i input_dir] namespace -- Script to deploy Kubernetes files to a new namespace.

where:
    -h  show this help text
    -i  set the input directory for kubernetes files(default: ./)
"
input_dir=./
while getopts ':hi:' option; do
  case "$option" in
    h) echo "$usage"
       exit
       ;;
    i) input_dir=$OPTARG
       ;;
    :) printf "missing argument\n" "$OPTARG"
       echo "$usage"
       exit 1
       ;;
   \?) printf "illegal option: -%s\n" "$OPTARG"
       echo "$usage"
       exit 1
       ;;
  esac
done
shift $((OPTIND - 1))

namespace=$1

if test -z "${namespace}"
then
	echo "Missing namespace."
	echo "$usage"
	exit 1
fi

echo "(Re)create namespace ${namespace} ..."
kubectl delete namespaces ${namespace} || true
kubectl create namespace ${namespace} 

echo "Copy secrets ..."
kubectl get secret ods-registry-secret --namespace=ods --export -o yaml |\
kubectl apply --namespace=${namespace} -f -

echo "Deploy ..."
kubectl apply -f ${input_dir}
