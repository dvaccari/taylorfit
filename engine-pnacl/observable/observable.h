#ifndef _TF_OBSERVABLE_H_
#define _TF_OBSERVABLE_H_

#include <vector>
#include <unordered_map>

template <typename T>
class Observer {
  public:
    virtual void  update(std::string, T&) = 0;

    bool operator==(const Observer<T> &other) {
      return *this == other;
    }
};

template <typename T>
using ObserverList  = std::vector<Observer<T>*>;
template <typename T>
using ObserverMap   = std::unordered_map<std::string, ObserverList<T>>;

template <typename T>
class Observable {
  public:
    Observable()    { }

    virtual void fire(std::string event) {
      for (Observer<T> *observer : listeners_[event]) {
        observer->update(event, *static_cast<T*>(this));
      }
    }

    virtual void on(std::string event, Observer<T> &observer) {
      listeners_[event].push_back(&observer);
    }

    /*
    virtual void remove(std::string event, Observer<T> &observer) {
      ObserverList<T> obs = listeners_[event];
      typename ObserverList<T>::iterator it;

      for (it = obs.begin(); it != obs.end();) {
        if (**it == observer) {
          obs.erase(std::remove(obs.begin(), obs.end(), it), obs.end());
        } else {
          it++;
        }
      }
    }
    */

  private:
    ObserverMap<T>  listeners_;
};

#endif
