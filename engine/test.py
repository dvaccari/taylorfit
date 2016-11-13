

import numpy as np
import time
import sys

N = int(sys.argv[1])
T = int(sys.argv[2])
CT= int(sys.argv[3])


top = 20

t = time.time()
for i in range(CT):
    x = np.random.rand(N, T) * top
    y = np.random.rand(N)
    np.linalg.lstsq(x, y)
print((time.time() - t) * 1000, "ms")
