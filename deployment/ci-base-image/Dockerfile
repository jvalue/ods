FROM python:3-alpine

ENV KUBE_LATEST_VERSION="v1.17.2"

# https://github.com/lachie83/k8s-kubectl/blob/master/Dockerfile
RUN apk add --update ca-certificates \
 && apk add --update -t deps curl \
 && curl -L https://storage.googleapis.com/kubernetes-release/release/${KUBE_LATEST_VERSION}/bin/linux/amd64/kubectl -o /usr/local/bin/kubectl \
 && chmod +x /usr/local/bin/kubectl \
 && apk del --purge deps \
 && rm /var/cache/apk/*

RUN pip3 install --upgrade argparse


