
#include <vector>
#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_dictionary.h"
#include "ppapi/cpp/var_array.h"
#include "json/json.h"
#include "utils/utils.h"
#include "model/model.h"
#include "statistics/statistics.h"
#include "observable/progress.h"

/// The Instance class.  One of these exists for each instance of your NaCl
/// module on the web page.  The browser will ask the Module object to create
/// a new Instance for each occurrence of the <embed> tag that has these
/// attributes:
///     src="hello_tutorial.nmf"
///     type="application/x-pnacl"
/// To communicate with the browser, you must override HandleMessage() to
/// receive messages from the browser, and use PostMessage() to send messages
/// back to the browser.  Note that this interface is asynchronous.
class TFEngineAdapter : public pp::Instance,
                        Observer<Progress>,
                        Observer<Model> {
  private:
    bool subscribed_to_changes_;

  public:
    Model *m;
    /// The constructor creates the plugin-side instance.
    /// @param[in] instance the handle to the browser-side plugin instance.
    explicit TFEngineAdapter(PP_Instance instance)
      : pp::Instance(instance),
        subscribed_to_changes_(true),
        m(new Model())
        {
          Statistic::init();
          m->on("setData", *this);
          m->on("setMultiplicands", *this);
          m->on("setExponents", *this);
          m->on("setDependent", *this);
          m->on("setLags", *this);
          m->on("addTerm", *this);
          m->on("removeTerm", *this);
        }

    virtual ~TFEngineAdapter() {}

    /// Handler for messages coming in from the browser via postMessage()
    virtual void HandleMessage(const pp::Var& var_message) {
      Json::FastWriter writer;

      if (!var_message.is_dictionary()) {
        PostMessage("ERROR");
      }
      pp::VarDictionary dict_message(var_message);

      std::string message_type = dict_message.Get(pp::Var("type")).AsString();
      pp::Var message_data = dict_message.Get(pp::Var("data"));

      try {
        // modify parameters
        if (message_type == "setData") {
          m->set_data(pp::VarArray(message_data));
        } else if (message_type == "setExponents") {
          m->set_exponents(pp::VarArray(message_data));
        } else if (message_type == "setMultiplicands") {
          m->set_multiplicands(message_data.AsInt());
        } else if (message_type == "setDependent") {
          m->set_dependent(message_data.AsInt());
        } else if (message_type == "setLags") {
          m->set_lags(pp::VarArray(message_data));

        } else if (message_type == "subset") {
          // TODO

        // modify terms
        } else if (message_type == "addTerm") {
          m->add_term(
            tf_utils::ppvar_to_part_set(pp::VarArray(message_data))
          );
        } else if (message_type == "removeTerm") {
          m->remove_term(
            tf_utils::ppvar_to_part_set(pp::VarArray(message_data))
          );

        // other
        } else if (message_type == "clear") {
          m->clear();
        } else if (message_type == "getStatisticsMetadata") {
          // TODO
        } else if (message_type == "unsubscribeToChanges") {
          subscribed_to_changes_ = false;
        } else if (message_type == "subscribeToChanges") {
          subscribed_to_changes_ = true;
        } else {
          PostMessage("{\"error\": \"Bad message type\"}");
          return;
        }
      } catch (std::string &e) {
        PostMessage("{\"error\":" + e + "}");
        return;
      } catch (std::exception &e) {
        PostMessage("{\"error\":" + std::string(e.what()) + "}");
        return;
      }
    }

    void update(std::string s, Progress &p) {
      Json::FastWriter writer;
      Json::Value p_json = Json::Value(Json::objectValue);

      p_json["curr"] = p.curr_value();
      p_json["total"] = p.max_value();
      PostMessage(writer.write(p_json));
    }

    void update(std::string s, Model &m) {
      Json::FastWriter writer;

      if (subscribed_to_changes_) {
        PostMessage(writer.write(m.get_candidates(*this)));
      }
    }
};

/// The Module class.  The browser calls the CreateInstance() method to create
/// an instance of your NaCl module on the web page.  The browser creates a new
/// instance for each <embed> tag with type="application/x-pnacl".
class TFEngineModule : public pp::Module {
 public:
  TFEngineModule() : pp::Module() {}
  virtual ~TFEngineModule() {}

  // Called whenever <embed> for this .pexe is encountered
  virtual pp::Instance* CreateInstance(PP_Instance instance) {
    return new TFEngineAdapter(instance);
  }
};

namespace pp {
  // Singleton managed by browser
  Module* CreateModule() {
    return new TFEngineModule();
  }
}
