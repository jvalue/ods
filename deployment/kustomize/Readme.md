# Deployment with kustomize

## What?

https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/

## Why?

Because it already comes with kubectl, which is nice.

A small disadvantage though: it is not designed to be another tmeplating engine.

## How?

To get all the descriptors as one whole output:
```sh
$ kubectl kustomize .
```

To deploy everything to k8s:
```sh
$ kubectl apply k .
```

Note: Wherever there is a kustomize.yaml file, you should be able to run kubectl kustomize or the standalone version of kustomize.