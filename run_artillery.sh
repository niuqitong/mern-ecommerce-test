#!/bin/bash

config_files=("artillery_100.json" "artillery_200.json" "artillery_500.json")

for config_file in "${config_files[@]}"; do
  echo "Running Artillery with configuration: $config_file"
  artillery run "$config_file"
done