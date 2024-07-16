#!/bin/bash

ignore_pattern=".*\.example\..*"

deploy_file() {
  local filename=$1

  echo "Deploying $filename"
  ./ampy.py -p "$serial_port" put "$filename" "$filename"
}

deploy_all_files() {
  files=$(ls -1 *.py)
  for file in $files
  do
    if [[ -f "$file" && ! -L "$file" && ! $file =~ $ignore_pattern ]]; then
      deploy_file "$file"
    fi
  done
}

if [ $# -lt 1 ]; then
  echo "Usage: deploy.sh <serial_port> [filename]"
  echo "If no filename is specified, all files will be copied to the device."
  exit 1
fi

serial_port=$1

if [ $# -gt 1 ]; then
    deploy_file $2
else
    deploy_all_files
fi
