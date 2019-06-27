CEPHESDIR=deps/cephes

# Download float 32bit library
mkdir -p $CEPHESDIR
curl http://www.netlib.org/cephes/single.tgz | tar xz -C $CEPHESDIR

# Remove compile files and instructions
cd $CEPHESDIR && \
    rm -f *.mak *.MAK *.bat *.rsp *.rf *.mms README *.doc ftilib.* Makefile \
    setprec.* setprelf.387 singledoc.html floatlib.h powtst.c mtherr.c \
    drand.c floorf.c mtstf.c nantst.c polynf.c chbevlf.c polevlf.c \
    cabsf.c caddf.c cacosf.c casinf.c catanf.c ccosf.c ccotf.c cdivf.c cexpf.c clogf.c \
    cmovf.c cmulf.c cnegf.c csubf.c csinf.c csqrtf.c ctanf.c cmplxf.c
cd -

sed -i '' -e 's/define STDC_HEADERS 1/define STDC_HEADERS 0/g' $CEPHESDIR/mconf.h
sed -i '' -e 's%#define IBMPC 1%/* #define IBMPC 1 */%g' $CEPHESDIR/mconf.h
sed -i '' -e 's%/\* #define UNK 1 \*/%#define UNK 1%g' $CEPHESDIR/mconf.h
sed -i '' -e 's/define BIGENDIAN 1/define BIGENDIAN 0/g' $CEPHESDIR/mconf.h
sed -i '' -e 's%Complex numeral.  \*/%Complex numeral. \*//\*%g' $CEPHESDIR/mconf.h
sed -i '' -e 's%/\* Long double complex numeral.  \*/%\*//\* Long double complex numeral.  \*/%g' $CEPHESDIR/mconf.h

echo '' > $CEPHESDIR/protos.h

#printf '%s\n%s\n' '#include "mconf.h"' $(cat $CEPHESDIR/chbevlf.c) > $CEPHESDIR/chbevlf.c
#printf '%s\n%s\n' '#include "mconf.h"' $(cat $CEPHESDIR/constf.c) > $CEPHESDIR/constf.c

# Format the file so it looks readable
clang-format -style=llvm -i cephes/*.c

# Parse all c files
for f in $CEPHESDIR/*.c
do
  echo "parseing $f"
  gcc -E $f | python3 ./scripts/parse_c_to_json.py > "$CEPHESDIR/$(basename "$f" .c).json"
done
