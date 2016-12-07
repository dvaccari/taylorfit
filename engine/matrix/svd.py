
import numpy as np

a = np.array([[22,10, 2,  3, 7],
              [14, 7,10,  0, 8],
              [-1,13,-1,-11, 3],
              [-3,-2,13, -2, 4],
              [ 9, 8, 1, -2, 4],
              [ 9, 1,-7,  5,-1],
              [ 2,-6, 6,  5, 1],
              [ 4, 5, 0, -2, 2]])

b = np.array([12, 5, -2, -7, 1, 3, 10, 3])

np.set_printoptions(suppress=True, linewidth=100)
u, w, v = np.linalg.svd(a)

bhat = np.linalg.lstsq(a, b)[0]
bhat2 = np.dot(np.dot(np.linalg.inv(np.dot(a.T, a)), a.T), b)

aat = np.dot(a.T, a) * 1.0
print(aat)
aatinv = np.linalg.inv(aat)
print(np.dot(aatinv, aat))

print(np.linalg.cond(aat) > np.finfo(aat.dtype).eps)


#print(bhat)
#print(bhat2)


