

import numpy as np
import time
import sys

N = int(sys.argv[1])
T = int(sys.argv[2])

top = 20

x = np.random.rand(N, T) * top
y = np.random.rand(N)

t = time.time()
np.linalg.lstsq(x, y)
print((time.time() - t) * 1000, "ms")
