#!/bin/sh
cat > kube.config <<EOF
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${K8S_CLUSTER_CERTIFICATE_AUTHORITY_DATA}
    server: ${K8S_CLUSTER_SERVER}
  name: ods-deployment-cluster
contexts:
- context:
    cluster: ods-deployment-cluster
    user: ${K8S_SERVICEACCOUNT_NAME}
  name: ods-deployment-context
current-context: ods-deployment-context
kind: Config
preferences: {}
users:
- name: ${K8S_SERVICEACCOUNT_NAME}
  user:
    token: ${K8S_SERVICEACCOUNT_TOKEN}
EOF
