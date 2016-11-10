
import numpy as np
import sys
import argparse
import matplotlib.pyplot as plt
import itertools
from mpl_toolkits.mplot3d import Axes3D
from matplotlib import cm

LOW_LIMIT = 1e-3

parser = argparse.ArgumentParser(description="Find a model for the data!")

parser.add_argument(
    "data",
    type=lambda f: np.genfromtxt(f, delimiter=",", skip_header=1)
)

parser.add_argument(
    "-i",
    "--indep-col",
    type=int
)

parser.add_argument(
    "-d",
    "--degree",
    type=int
)

parser.add_argument(
    "-l"
    "--term-combo-limit",
    type=int
)


args = parser.parse_args()
data = args.data
indep_col = args.indep_col or data.shape[1] - 1
headers = open(sys.argv[1], "r").readline().strip().split(",")

train_input = np.hstack([data[:,:indep_col], data[:,indep_col+1:]])
train_output = data[:,indep_col]

# combine terms
def prod(*terms):
    p = 1
    if len(terms) == 1 and type(terms[0]) == list:
        terms = terms[0]
    for term in terms:
        p *= term
    return p

combos = []
for degree in range(1, args.degree + 1):
    combos += itertools.combinations_with_replacement(
        range(train_input.shape[1]), degree
    )

aug_input = np.transpose([
    prod([train_input[:,combo[i]] for i in range(len(combo))]) for combo in combos
])

model = np.linalg.lstsq(aug_input, train_output)[0]

def predict(model, combos, point):
    aug_point = np.transpose([
        prod([point[combo[i]] for i in range(len(combo))]) for combo in combos
    ])
    return sum(map(lambda i: model[i] * aug_point[i], range(len(model))))

def format_poly(model, combos, headers):
    result = ""
    for i in range(len(model)):
        if abs(model[i]) > LOW_LIMIT:
            count = {}
            term = "" if abs(round(model[i], 3)) == 1.0 else str(abs(round(model[i], 3)))
            for x in combos[i]:
                if x not in count:
                    count[x] = 0
                count[x] += 1
            for key in count.keys():
                term += str(headers[key])
                if count[key] > 1:
                    term += "^" + str(count[key])

            if model[i] < 0: result += " - " + term
            else: result += " + " + term
    return result[3:]


print(model)
print()
print(headers[indep_col] + " = " + format_poly(
    model,
    combos,
    headers[:indep_col] + headers[indep_col+1:]
))
print()

def make_line(model, combos, train_input, dim=0):
    domain = np.arange(min(train_input[:,dim]), max(train_input[:,dim]), 1)
    dom = np.zeros((domain.shape[0], train_input.shape[1]))
    dom[:,dim] = domain
    rang = list(map(lambda x: predict(model, combos, x), dom))
    return domain, rang

def make_surface(model, combos, train_input, step=1):
    X = np.arange(train_input[:,0].min(), train_input[:,0].max() + 1, step)
    Y = np.arange(train_input[:,1].min(), train_input[:,1].max() + 1, step)
    X, Y = np.meshgrid(X, Y)
    rang = np.zeros(X.shape)
    for i in range(X.shape[0]):
        for j in range(X.shape[1]):
            rang[i,j] = predict(model, combos, [X[i,j], Y[i,j]])
    return X, Y, rang


#fig = plt.figure()
#for dim in range(train_input.shape[1]):
#    dom, rang = make_line(model, combos, train_input, dim)
#    subplt = fig.add_subplot(train_input.shape[1], 1, dim + 1)
#    subplt.plot(dom, rang, "b-")
#    subplt.plot(train_input[:,dim], train_output, "ro")
#plt.show()

# create translucent heatmap
#hm = cm.get_map()
#hm._init()
#alphas = np.abs(np.linspace(-1.0, 1.0, hm.N))
#hm._lut[:-3,-1] = alphas

# plot results
fig = plt.figure()
subplt = fig.add_subplot(111, projection='3d')
x_hat, y_hat, rang = make_surface(model, combos, train_input, 0.5)
subplt.plot_surface(x_hat, y_hat, rang,
                    rstride=1, cstride=1,
                    alpha=0.5, color="c", linewidth=0)

x, y = train_input[:,0], train_input[:,1]
subplt.scatter(x, y, train_output, color="r", s=20, depthshade=False)

for sample_i in range(len(aug_input)):
    z = predict(model, combos, aug_input[sample_i])
    x, y = train_input[sample_i,[0,1]]
    subplt.plot([x, x], [y, y], [z, train_output[sample_i]], "g-")

plt.tight_layout()
plt.show()





