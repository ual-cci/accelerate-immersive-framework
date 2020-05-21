#!/bin/bash
FILE="/Users/louismccallum/Documents/programming/MIMIC/Website/MIMIC-editor/emberShareDB/public/libs/maxiSynthProcessor.v.0.5.js"
tail -n +2 "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
(echo "import Maximilian from \"https://mimicproject.com/libs/maximilian.wasmmodule.v.0.3.js\"" && cat $FILE) > $FILE.tmp && mv $FILE.tmp $FILE
ember build --environment firebase
tail -n +2 "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
(echo "import Maximilian from \"http://localhost:4200/libs/maximilian.wasmmodule.v.0.3.js\"" && cat $FILE) > $FILE.tmp && mv $FILE.tmp $FILE
rm -rf firebase/public
mkdir firebase/public
cp -a dist/ firebase/public
cd firebase/
firebase deploy
