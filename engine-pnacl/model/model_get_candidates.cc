
#include <thread>
#include <mutex>
#include <unistd.h>
#include <queue>

#include "model.h"
#include "../utils/utils.h"

#include <iostream>

const int THREADS = 100;

std::mutex read_mtx;
std::mutex write_mtx;

void compute_candidates(
    std::queue<Term*> *terms,
    std::vector<Term*> *results
) {
  Term *t;

  while (true) {
    read_mtx.lock();
    if (terms->empty()) {
      read_mtx.unlock();
      return;
    }
    t = terms->front();
    terms->pop();
    read_mtx.unlock();

    // Compute statistics!!
    usleep(500000);

    write_mtx.lock();
    results->push_back(t);
    write_mtx.unlock();
  }
  return; // lel
}

std::vector<Term*> Model::get_candidates() {
  std::vector<Term*>    candidates;
  std::vector<int>      cols = range(0, _data->n());
  std::queue<Term*>     terms;
  std::vector<part_set> loose_terms;

  cols.erase(std::remove(cols.begin(), cols.end(), _dependent), cols.end());
  loose_terms = generate_terms(cols, _exponents, _multiplicands, _lags);

  for (part_set p : loose_terms) {
    terms.push(_termpool.get(p));
  }

  std::thread pool[THREADS];

  for (int i = 0; i < THREADS; i++) {
    pool[i] = std::thread(compute_candidates, &terms, &candidates);
  }

  for (int i = 0; i < THREADS; i++) {
    pool[i].join();
  }

  return candidates;
}

