
import numpy as np

LOW     = -10
HIGH    =  10
VAR     =  5
SAMPLES =  50
OUTLIER_VAR = 40
OUTLIER_FREQ= 0.1

outs = []

def func(x, y):
    return x + y - x**3 - x*y + y**2


print("x,y,f(x y)")
for n in range(SAMPLES):
    x = np.random.randint(LOW, HIGH)
    y = np.random.randint(LOW, HIGH)
    f = func(x, y)
    outs += [abs(f)]
    if (np.random.random() <= OUTLIER_FREQ):
        f = np.random.randn()*max(outs)
    else:
        f += np.random.randn()*VAR
    print(str(x) + "," + str(y) + "," + str(f))
