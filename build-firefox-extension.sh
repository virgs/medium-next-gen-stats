#! /bin/bash
zip -r -FS ../firefox-mngs.zip * --exclude '*.git*' -x 'scratches/*' -x '.idea' -x '.gitignore' -x 'LICENSE' -x 'README' -x 'build-firefox-extension.sh' -x 'images/.DS_Store' -x 'src/.DS_Store'
