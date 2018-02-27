module.exports = {
    cppFunc(){
        var terms = [];
        var output = "double model(";
        for (var i = 0; i < model().result_fit().terms.length; i++){
            if(terms.indexOf(model().result_fit().terms[i].term[0].name) == -1){
                terms.push(model().result_fit().terms[i].term[0].name);
                output += "double " + terms[i];
                if(i != model().result_fit().terms.length-1)
                    output += ", ";
            }
        }
        if(output.substring(output.length-1, output.length) == " ")
            output = output.substring(0, output.length-2);
        output += "){return ";

        for(var i = 0; i < model().result_fit().terms.length; i++){
            output += "(" + model().result_fit().terms[i].coeff;
            for(var j = 0; j < model().result_fit().terms[i].term[0].exp; j++){
                output += " * " + model().result_fit().terms[i].term[0].name;
            }
            if(i != model().result_fit().terms.length-1)
                output += ") + ";
        }
        output += ");}";

        return output;
    },



    excelFunc(){
        var terms = [];
        var output = "Function MODEL(";
        for (var i = 0; i < model().result_fit().terms.length; i++){
            if(terms.indexOf(model().result_fit().terms[i].term[0].name) == -1){
                terms.push(model().result_fit().terms[i].term[0].name);
                output += terms[i];
                if(i != model().result_fit().terms.length-1)
                    output += ", ";
            }
        }
        if(output.substring(output.length-1, output.length) == " ")
            output = output.substring(0, output.length-2);
        output += ")MODEL = ";

        for(var i = 0; i < model().result_fit().terms.length; i++){
            output += "(" + model().result_fit().terms[i].coeff;
            for(var j = 0; j < model().result_fit().terms[i].term[0].exp; j++){
                output += " * " + model().result_fit().terms[i].term[0].name;
            }
            if(i != model().result_fit().terms.length-1)
                output += ") + ";
        }
        output += ") End Function";

        return output;
    },



    matlabFunc(){
        var terms = [];
        var output = "function m = model(";
        for (var i = 0; i < model().result_fit().terms.length; i++){
            if(terms.indexOf(model().result_fit().terms[i].term[0].name) == -1){
                terms.push(model().result_fit().terms[i].term[0].name);
                output += terms[i];
                if(i != model().result_fit().terms.length-1)
                    output += ", ";
            }
        }
        if(output.substring(output.length-1, output.length) == " ")
            output = output.substring(0, output.length-2);
        output += ")\n\tm = ";

        for(var i = 0; i < model().result_fit().terms.length; i++){
            output += "(" + model().result_fit().terms[i].coeff;
            for(var j = 0; j < model().result_fit().terms[i].term[0].exp; j++){
                output += " * " + model().result_fit().terms[i].term[0].name;
            }
            if(i != model().result_fit().terms.length-1)
                output += ") + ";
        }
        output += ");\nend";

        return output;
    },



    pythonFunc(){
        var terms = [];
        var output = "def model(";
        for (var i = 0; i < model().result_fit().terms.length; i++){
            if(terms.indexOf(model().result_fit().terms[i].term[0].name) == -1){
                terms.push(model().result_fit().terms[i].term[0].name);
                output += terms[i];
                if(i != model().result_fit().terms.length-1)
                    output += ", ";
            }
        }
        if(output.substring(output.length-1, output.length) == " ")
            output = output.substring(0, output.length-2);
        output += "): \n\treturn ";

        for(var i = 0; i < model().result_fit().terms.length; i++){
            output += "(" + model().result_fit().terms[i].coeff;
            for(var j = 0; j < model().result_fit().terms[i].term[0].exp; j++){
                output += " * " + model().result_fit().terms[i].term[0].name;
            }
            if(i != model().result_fit().terms.length-1)
                output += ") + ";
        }
        output += ")";

        return output;
    },



    jsFunc(){
        var terms = [];
        var output = "function model(";
        for (var i = 0; i < model().result_fit().terms.length; i++){
            if(terms.indexOf(model().result_fit().terms[i].term[0].name) == -1){
                terms.push(model().result_fit().terms[i].term[0].name);
                output += "double " + terms[i];
                if(i != model().result_fit().terms.length-1)
                    output += ", ";
            }
        }
        if(output.substring(output.length-1, output.length) == " ")
            output = output.substring(0, output.length-2);
        output += "){return ";

        for(var i = 0; i < model().result_fit().terms.length; i++){
            output += "(" + model().result_fit().terms[i].coeff;
            for(var j = 0; j < model().result_fit().terms[i].term[0].exp; j++){
                output += " * " + model().result_fit().terms[i].term[0].name;
            }
            if(i != model().result_fit().terms.length-1)
                output += ") + ";
        }
        output += ");}";

        return output;
    }
}