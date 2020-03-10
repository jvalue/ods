#!/usr/bin/python3

import os
import errno
import argparse

# parse arguments
parser = argparse.ArgumentParser(description='Generates Kubernetes files.')
parser.add_argument('namespace', type=str, help='Name used for the namespace of generated files.')
parser.add_argument('base_url', type=str, help='The base url of the deployed instance')
parser.add_argument('--output_dir', type=str, default='./output', help='Directory in which the generated files will be saved.')
parser.add_argument('--template_dir', type=str, default='./templates', help='Directory from which templates should be loaded.')
parser.add_argument('--image_tag', type=str, default='latest', help='Default tags for docker images.')
args = parser.parse_args()

NAMESPACE_KEY = '{{NAMESPACE}}'
BASE_URL_KEY = '{{BASE_URL}}'
IMAGE_TAG_KEY = '{{IMAGE_TAG}}'

template_path = args.template_dir
output_path = args.output_dir
namespace_value = args.namespace
base_url_value = args.base_url
image_tag_value = args.image_tag

script_dir = os.path.dirname(os.path.realpath(__file__))

# traverse files
files = list()

template_dir = os.path.join(script_dir, template_path)

for dir_path, dir_names, file_names in os.walk(template_dir):
    for name in file_names:
        files.append(os.path.join(dir_path, name))

# create output directory
try:
    os.mkdir(output_path)
except OSError as e:
    if e.errno != errno.EEXIST:
        raise

# create instance
for template_file in files:
    file_name = os.path.basename(template_file)
    instance_file_name = os.path.join(output_path, namespace_value + '-' + file_name)
    with open(template_file, "rt") as fin:
        with open(instance_file_name, "wt") as fout:
            for line in fin:
                line = line.replace(NAMESPACE_KEY, namespace_value)
                line = line.replace(IMAGE_TAG_KEY, image_tag_value)
                fout.write(line.replace(BASE_URL_KEY, base_url_value))

print("Kubernetes files were successfully generated and saved in " + output_path)


