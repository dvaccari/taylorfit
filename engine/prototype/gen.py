
import numpy as np

LOW         = -10
HIGH        =  10
INTERCEPT   =   300
VAR         =   0.5
SAMPLES     =  50
OUTLIER_VAR =   2
OUTLIER_FREQ=   0.05

STRICT      = True

outs = []

def func(x, y, intercept=0):
    return intercept + x + y - x**3 - x*y + y**2


print("x,y,f(x y)")
for n in range(SAMPLES):
    x = np.random.randint(LOW, HIGH)
    y = np.random.randint(LOW, HIGH)
    f = func(x, y, INTERCEPT)
    outs += [abs(f)]
    if not STRICT:
        if (np.random.random() <= OUTLIER_FREQ):
            f = np.random.randn()*max(outs)
        else:
            f += np.random.randn()*VAR
    print(str(x) + "," + str(y) + "," + str(f))
