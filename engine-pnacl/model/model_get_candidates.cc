
#include <thread>
#include <mutex>
#include <queue>

#include "model.h"
#include "../utils/utils.h"
#include "../observable/progress.h"

const int THREADS = 1;

std::mutex read_mtx;
std::mutex write_mtx;

void compute_candidates(
    std::queue<Term*>         *terms,
    std::vector<Json::Value>  *results,
    Progress                  *progress
) {
  stats_bundle  stats;
  Json::Value   result;
  Term         *t;

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
    stats = t->get_stats();
    result = Json::Value(Json::objectValue);
    result["stats"] = tf_utils::stats_bundle_to_json(stats);
    result["term"] = t->toJSON();

    write_mtx.lock();
    results->push_back(result);
    progress->tick();
    write_mtx.unlock();
  }
  return; // lel
}

Json::Value Model::get_candidates(Observer<Progress> &observer) {
  std::queue<Term*>     candidates;
  std::vector<int>      cols = tf_utils::range(0, data_.at(DEFAULT_LABEL)->n());
  std::vector<part_set> loose_terms;
  std::vector<Json::Value> result;

  cols.erase(std::remove(cols.begin(), cols.end(), dependent_), cols.end());
  loose_terms = generate_terms(cols, exponents_, multiplicands_, lags_);

  for (part_set p : loose_terms) {
    candidates.push(termpool_.get(p));
  }

  // Set progress to nil
  Progress p(candidates.size());
  p.on_progress(observer);

  std::thread pool[THREADS];

  for (int i = 0; i < THREADS; i++) {
    pool[i] = std::thread(compute_candidates, &candidates, &result, &p);
  }

  for (int i = 0; i < THREADS; i++) {
    pool[i].join();
  }

  Json::Value result_json = Json::Value(Json::arrayValue);

  for (Json::Value &stats : result) {
    result_json.append(stats);
  }

  return result_json;
}

