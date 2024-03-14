APP=../www/mathex
DOC=../../mathex-doc
VERSION=0.0.1

all:
	-rm -rf $(APP)-old
	-mv -f $(APP) $(APP)-old
	unzip -q version/mathex-ee-$(VERSION).zip -d $(APP)
	-ln -s $(DOC) $(APP)/doc
