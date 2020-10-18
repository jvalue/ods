#!/bin/bash

export ADAPTER_API=http://localhost:9000/api/adapter
export PIPELINE_API=http://localhost:9000/api/pipelines

npm run transpile
node dist/index.js
