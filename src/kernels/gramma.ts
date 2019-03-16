
import linker from '../linker';
import { types, defineConstant } from '../linker';

linker.addConstant("gammaf_STIR", types.array.float, [
    -2.705194986674176E-003, 3.473255786154910E-003, 8.333331788340907E-002
]);
linker.addConstant("gammaf_MAXSTIR", types.scalar.float, 26.77);
linker.addConstant("gammaf_SQTPIF", types.scalar.float, 2.50662827463100050242);

export let stir = linker.addKernel({
    name: "stir",
    dependencies: ["polevl"],
    constants: ["gammaf_STIR", "gammaf_MAXSTIR", "gammaf_SQTPIF"],
    code: `
        static float stirf( float xx ) {
            float x, y, w, v;

            x = xx;
            w = 1.0/x;
            w = 1.0 + w * polevlf( w, gammaf_STIR, 2 );
            y = expf( -x );
            if( x > gammaf_MAXSTIR )
                { /* Avoid overflow in pow() */
                v = powf( x, 0.5 * x - 0.25 );
                y *= v;
                y *= v;
                }
            else
                {
                y = powf( x, x - 0.5 ) * y;
                }
            y = gammaf_SQTPIF * y * w;
            return( y );
        }
    `
})

linker.addConstant("gammaf_P", types.array.float,  [
    1.536830450601906E-003, 5.397581592950993E-003, 4.130370201859976E-003,
    7.232307985516519E-002, 8.203960091619193E-002, 4.117857447645796E-001,
    4.227867745131584E-001, 9.999999822945073E-001
]);

export let gamma = linker.addKernel({
    name: "gamma",
    dependencies: [stir, "polevl", "p1evl"],
    constants: ["gammaf_P"],
    code: `
    #ifdef ANSIC
    float gammaf( float xx )
    #else
    float gammaf(xx)
    double xx;
    #endif
    {
        float p, q, x, z, nz;
        int i, direction, negative;

        x = xx;
        sgngamf = 1;
        negative = 0;
        nz = 0.0;
        if( x < 0.0 )
            {
            negative = 1;
            q = -x;
            p = floorf(q);
            if( p == q )
                goto goverf;
            i = p;
            if( (i & 1) == 0 )
                sgngamf = -1;
            nz = q - p;
            if( nz > 0.5 )
                {
                p += 1.0;
                nz = q - p;
                }
            nz = q * sinf( PIF * nz );
            if( nz == 0.0 )
                {
        goverf:
                mtherr( "gamma", OVERFLOW );
                return( sgngamf * MAXNUMF);
                }
            if( nz < 0 )
                nz = -nz;
            x = q;
            }
        if( x >= 10.0 )
            {
            z = stirf(x);
            }
        if( x < 2.0 )
            direction = 1;
        else
            direction = 0;
        z = 1.0;
        while( x >= 3.0 )
            {
            x -= 1.0;
            z *= x;
            }
        /*
        while( x < 0.0 )
            {
            if( x > -1.E-4 )
                goto small;
            z *=x;
            x += 1.0;
            }
        */
        while( x < 2.0 )
            {
            if( x < 1.e-4 )
                goto small;
            z *=x;
            x += 1.0;
            }

        if( direction )
            z = 1.0/z;

        if( x == 2.0 )
            return(z);

        x -= 2.0;
        p = z * polevlf( x, P, 7 );

        gdone:

        if( negative )
            {
            p = sgngamf * PIF/(nz * p );
            }
        return(p);

        small:
        if( x == 0.0 )
            {
            mtherr( "gamma", SING );
            return( MAXNUMF );
            }
        else
            {
            p = z / ((1.0 + 0.5772156649015329 * x) * x);
            goto gdone;
            }
    }
    `
})
