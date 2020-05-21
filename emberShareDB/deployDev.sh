#!/bin/bash
FILE="/Users/louismccallum/Documents/programming/MIMIC/Website/MIMIC-editor/emberShareDB/public/libs/maxiSynthProcessor.v.0.5.js"
tail -n +2 "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
(echo "import Maximilian from \"https://dev.codecircle.gold.ac.uk/libs/maximilian.wasmmodule.v.0.3.js\"" && cat $FILE) > $FILE.tmp && mv $FILE.tmp $FILE
ember build --environment development
tail -n +2 "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
(echo "import Maximilian from \"http://localhost:4200/libs/maximilian.wasmmodule.v.0.3.js\"" && cat $FILE) > $FILE.tmp && mv $FILE.tmp $FILE