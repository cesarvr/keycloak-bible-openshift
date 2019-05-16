#!/bin/bash
EXPORT_FOLDER="export"
mkdir -p "${PWD}/${EXPORT_FOLDER}/"
oc rsync $1:/tmp/migrate.json "${PWD}/${EXPORT_FOLDER}/"
