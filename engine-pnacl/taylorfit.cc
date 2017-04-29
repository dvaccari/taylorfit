
#include <vector>
#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_dictionary.h"
#include "ppapi/cpp/var_array.h"
#include "json/json.h"
#include "model/model.h"

#include <iostream>

/// The Instance class.  One of these exists for each instance of your NaCl
/// module on the web page.  The browser will ask the Module object to create
/// a new Instance for each occurrence of the <embed> tag that has these
/// attributes:
///     src="hello_tutorial.nmf"
///     type="application/x-pnacl"
/// To communicate with the browser, you must override HandleMessage() to
/// receive messages from the browser, and use PostMessage() to send messages
/// back to the browser.  Note that this interface is asynchronous.
class TFEngineAdapter : public pp::Instance {
  public:
    Model *m;
    /// The constructor creates the plugin-side instance.
    /// @param[in] instance the handle to the browser-side plugin instance.
    explicit TFEngineAdapter(PP_Instance instance) : pp::Instance(instance),
    m(new Model())
    {}
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
        if (message_type == "setData") {
          m->set_data(pp::VarArray(message_data));
        } else if (message_type == "setMultiplicands") {
          m->set_multiplicands(message_data.AsInt());
        } else if (message_type == "setExponents") {
          m->set_exponents(pp::VarArray(message_data));
        } else if (message_type == "lstsq") {
          PostMessage(pp::Var(writer.write(m->lstsq())));
        } else {
          PostMessage("{\"error\": \"Bad message type\"}");
          return;
        }

        std::vector<Term*> terms = m->get_candidates();
        Json::Value terms_json = Json::Value(Json::arrayValue);

        for (Term *t : terms) {
          terms_json.append(t->toJSON());
        }

        PostMessage(pp::Var(writer.write(m->toJSON())));
        PostMessage(pp::Var(writer.write(terms_json)));

      } catch (std::string &e) {
        PostMessage("{\"error\":" + e + "}");
        return;
      } catch (std::exception &e) {
        PostMessage("{\"error\":" + std::string(e.what()) + "}");
        return;
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
