/**
 * Type identification
 */
function estimateType( types: any[], src: any ): any {

  if (types.length === 1) {
    return types[0];
  }
  else {
    const srcKeys = Object.keys( src ).sort();

    const typeIndex = types.findIndex( type => {

      const typeKeys = Object.keys( new type() ).sort();
      if (typeKeys.length !== srcKeys.length) {
        return false;
      }

      return srcKeys.every( (key, i) => typeKeys[i] === key ) ;
    });

    if (typeIndex < 0) {
      throw new Error( `Unknown data type in the array: "${JSON.stringify( src )}"` );
    }

    return types[ typeIndex ];
  }

}

/**
 * Deep copy according to schema
 */
export function copy( src: any, dest: any, types?: any[] ) {

  for (const k in src) {

    let type = dest[k];

    if (types) {
      type = estimateType( types, src[k] );
    }

    if (type === undefined) {
      throw new Error( `Unknown data type in the record: "${k}" = "${src[k]}" (dest : ${JSON.stringify( dest )})` );
    }

    if (type === Number) {
      dest[k] = type( src[k] );
    }
    else if (type === String || type === Boolean) {
      dest[k] = type( src[k] );
    }
    else if (type === Date) {
      dest[k] = new type( src[k] );
    }
    else if (Array.isArray( type )) {
      if (!Array.isArray( src[k] )) {
        throw new Error( `Array is expected for "${k}"` );
      }

      const t = dest[k];
      dest[k] = [];
      copy( src[k], dest[k], t );
    }
    else if (typeof type === 'function') {
      dest[k] = new type();
      copy( src[k], dest[k] );
    }
    else {      // fixed value
      dest[k] = src[k];
    }
  }
}

/**
 * Flat value-copy according to schema
 * "type": for arrays, only one type is allowed
 */
export function copyValue( src: any, type: any ): any {
  if (type === Number) {
    return type( src );
  }
  else if (type === String || type === Boolean) {
    return type( src );
  }
  else if ((new type()) instanceof Date) {
    return new type( src );
  }
  else if (Array.isArray( type )) {
    if (!Array.isArray( src )) {
      throw new Error( `Array is expected for "${src}"` );
    }

    const valueType = type[0];
    return src.map( s => copyValue( s, valueType ) );
  }
  else if (typeof type === 'function') {
    return new type( src );
  }
  else {  // fixed value
    return src;
  }
}

/**
 * Removes unused fields after copying
 */
export function clearUnused( obj: any ) {
  for (const k in obj) {
    const type = obj[k];
    if (type === Number) {
      obj[k] = 0;
    }
    else if (type === String) {
      obj[k] = '';
    }
    else if (type === Boolean) {
      obj[k] = false;
    }
    else if (Array.isArray( type ) && type.length > 0 && typeof type[0] === 'function' ) {
      obj[k] = [];
    }
    else if (typeof type === 'function') {
      obj[k] = null;
    }
  }
}

export enum Target {
  KEY,
  VALUE,
}

/**
 * Joins all keys/values into a linear array separated by comma
 */
export function linearize( obj: any, sep: string, target: Target, prefix: string = ''): string {
  return Object.keys( obj ).map( key => {
    const value = obj[ key ];
    if (Array.isArray( value )) {
      if (target === Target.KEY) {
        return Object.keys( value ).map( i => `${prefix}${key}.${i}` ).join( sep );
      }
      else {
        return value.map( (v: any) => v.toString()).join( sep );
      }
    }
    else if (typeof value === 'object') {
      return linearize( value, sep, target, `${prefix}${key}.` );
    }
    else {
      return target === Target.KEY ? prefix + key : value.toString();
    }
  }).join( sep );
}

export function copyPlain( src: any, dest: any ) {
  for (const key in src) {
    dest[ key ] = src[ key ];
  }
}
