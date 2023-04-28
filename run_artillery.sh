#!/bin/bash

config_files=(./load_testing/*.json)

for config_file in "${config_files[@]}"; do
  echo "Running Artillery with configuration: $config_file"
  artillery run "$config_file"
done