#ifndef _BITOPS_H_
#define _BITOPS_H_

#include <stdint.h>
#include <limits.h>
#include <cassert>

namespace tf_utils {

static inline uint32_t rotl32 (uint32_t n, unsigned int c) {
  const unsigned int mask = (CHAR_BIT * sizeof(n) - 1);

  assert ( (c <= mask) && "rotate by type width or more" );
  c &= mask;
  return (n << c) | (n >> ( (-c)&mask ));
}

static inline uint32_t rotr32 (uint32_t n, unsigned int c) {
  const unsigned int mask = (CHAR_BIT * sizeof(n) - 1);

  assert ( (c <= mask) && "rotate by type width or more" );
  c &= mask;
  return (n >> c) | (n << ( (-c)&mask ));
}

}

#endif
