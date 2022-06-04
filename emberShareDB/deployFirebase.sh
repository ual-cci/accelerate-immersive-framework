!/bin/bash
#FILE="$PWD/public/libs/maxiSynthProcessor.v.0.4.js"
#tail -n +2 "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
#(echo "import Maximilian from \"https://mimicproject.com/libs/maximilian.wasmmodule.v.0.3.js\"" && cat $FILE) > $FILE.tmp && mv $FILE.tmp $FILE
#FILE2="$PWD/public/libs/maxiSynthProcessor.v.0.5.js"
#tail -n +2 "$FILE2" > "$FILE2.tmp" && mv "$FILE2.tmp" "$FILE2"
#(echo "import Maximilian from \"https://mimicproject.com/libs/maximilian.wasmmodule.v.0.5.js\"" && cat $FILE2) > $FILE2.tmp && mv $FILE2.tmp $FILE2
#FILE3="$PWD/public/libs/maxiSynthProcessor.v.0.6.js"
#tail -n +2 "$FILE3" > "$FILE3.tmp" && mv "$FILE3.tmp" "$FILE3"
#(echo "import Maximilian from \"https://mimicproject.com/libs/maximilian.wasmmodule.v.0.5.js\"" && cat $FILE3) > $FILE3.tmp && mv $FILE3.tmp $FILE3
ember build --environment firebase
#tail -n +2 "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
#(echo "import Maximilian from \"http://localhost:4200/libs/maximilian.wasmmodule.v.0.3.js\"" && cat $FILE) > $FILE.tmp && mv $FILE.tmp $FILE
#tail -n +2 "$FILE2" > "$FILE2.tmp" && mv "$FILE2.tmp" "$FILE2"
#(echo "import Maximilian from \"http://localhost:4200/libs/maximilian.wasmmodule.v.0.5.js\"" && cat $FILE2) > $FILE2.tmp && mv $FILE2.tmp $FILE2
#tail -n +2 "$FILE3" > "$FILE3.tmp" && mv "$FILE3.tmp" "$FILE3"
#(echo "import Maximilian from \"http://localhost:4200/libs/maximilian.wasmmodule.v.0.5.js\"" && cat $FILE3) > $FILE3.tmp && mv $FILE3.tmp $FILE3
rm -rf firebase/public
mkdir firebase/public
cp -r dist/* firebase/public
cd firebase/
firebase deploy
