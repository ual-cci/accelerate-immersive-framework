#!/bin/bash
ember build --environment firebase
rm -rf firebase/public
mkdir firebase/public
cp -a dist/ firebase/public
cd firebase/
firebase deploy
