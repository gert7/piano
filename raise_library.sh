#!/bin/sh

cd piano-npm/src

cp index.d.ts index.d.ts.two

rm *.d.ts

mv index.d.ts.two index.d.ts

tsc --declaration --emitDeclarationOnly *.ts

rbxtsc *.ts

cd ..

npm pack

cd ..

npm install ./piano-npm/rbxts-piano-npm-1.0.0.tgz

