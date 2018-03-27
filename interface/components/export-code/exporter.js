module.exports = {
    cppFunc(){
        var terms = [];
        var output = "double model(";
        for (var i = 1; i < model().result_fit().terms.length; i++){
            for(var j = 0; j < model().result_fit().terms[i].term.length; j++){
                if(terms.indexOf(model().result_fit().terms[i].term[j].name) == -1){
                    terms.push(model().result_fit().terms[i].term[j].name);
                    output += "double " + terms[terms.length-1] + ", ";
                }
            }
        }
        output = output.substring(0, output.length-2);
        output += "){\n\treturn ";

        for(var i = 0; i < model().result_fit().terms.length; i++){
            output += "(" + model().result_fit().terms[i].coeff;
            for(var k = 0; k < model().result_fit().terms[i].term.length; k++){
                if(model().result_fit().terms[i].term[k].exp == 1)
                    output += " * " + model().result_fit().terms[i].term[k].name;
                else if(model().result_fit().terms[i].term[k].exp != 0)
                    output += " * " + "pow(" + model().result_fit().terms[i].term[k].name + "," + model().result_fit().terms[i].term[k].exp + ")";
            }
            if(i != model().result_fit().terms.length-1)
                output += ") + ";
        }
        output += ");\n}";

        return output;
    },



    excelFunc(){
        var terms = [];
        var output = "Function MODEL(";
        for (var i = 1; i < model().result_fit().terms.length; i++){
            for(var j = 0; j < model().result_fit().terms[i].term.length; j++){
                if(terms.indexOf(model().result_fit().terms[i].term[j].name) == -1){
                    terms.push(model().result_fit().terms[i].term[j].name);
                    output += terms[terms.length-1] + ", ";
                }
            }
        }
        
        output = output.substring(0, output.length-2);
        output += ")MODEL = ";

        for(var i = 0; i < model().result_fit().terms.length; i++){
            output += "(" + model().result_fit().terms[i].coeff;
            for(var k = 0; k < model().result_fit().terms[i].term.length; k++){
                if(model().result_fit().terms[i].term[k].exp == 1)
                    output += " * " + model().result_fit().terms[i].term[k].name;
                else if(model().result_fit().terms[i].term[k].exp != 0)
                    output += " * " + "POWER(" + model().result_fit().terms[i].term[k].name + "," + model().result_fit().terms[i].term[k].exp + ")";
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
        for (var i = 1; i < model().result_fit().terms.length; i++){
            for(var j = 0; j < model().result_fit().terms[i].term.length; j++){
                if(terms.indexOf(model().result_fit().terms[i].term[j].name) == -1){
                    terms.push(model().result_fit().terms[i].term[j].name);
                    output += terms[terms.length-1] + ", ";
                }
            }
        }
        
        output = output.substring(0, output.length-2);
        output += ")\n\tm = ";

        for(var i = 0; i < model().result_fit().terms.length; i++){
            output += "(" + model().result_fit().terms[i].coeff;
            for(var k = 0; k < model().result_fit().terms[i].term.length; k++){
                if(model().result_fit().terms[i].term[k].exp == 1)
                    output += " * " + model().result_fit().terms[i].term[k].name;
                else if(model().result_fit().terms[i].term[k].exp != 0)
                    output += " * (" + model().result_fit().terms[i].term[k].name + "^" + model().result_fit().terms[i].term[k].exp + ")";
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

        for (var i = 1; i < model().result_fit().terms.length; i++){
            for(var j = 0; j < model().result_fit().terms[i].term.length; j++){
                if(terms.indexOf(model().result_fit().terms[i].term[j].name) == -1){
                    terms.push(model().result_fit().terms[i].term[j].name);
                    output += terms[terms.length-1] + ", ";
                }
            }
        }

        output = output.substring(0, output.length-2);
        output += "): \n\treturn ";

        for(var i = 0; i < model().result_fit().terms.length; i++){
            output += "(" + model().result_fit().terms[i].coeff;
            for(var k = 0; k < model().result_fit().terms[i].term.length; k++){
                if(model().result_fit().terms[i].term[k].exp == 1)
                    output += " * " + model().result_fit().terms[i].term[k].name;
                else if(model().result_fit().terms[i].term[k].exp != 0)
                    output += " * (" + model().result_fit().terms[i].term[k].name + "**" + model().result_fit().terms[i].term[k].exp + ")";
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

        for (var i = 1; i < model().result_fit().terms.length; i++){
            for(var j = 0; j < model().result_fit().terms[i].term.length; j++){
                if(terms.indexOf(model().result_fit().terms[i].term[j].name) == -1){
                    terms.push(model().result_fit().terms[i].term[j].name);
                    output += "double " + terms[terms.length-1] + ", ";
                }
            }
        }
        output = output.substring(0, output.length-2);
        output += "){\n\treturn ";

        for(var i = 0; i < model().result_fit().terms.length; i++){
            output += "(" + model().result_fit().terms[i].coeff;
            for(var k = 0; k < model().result_fit().terms[i].term.length; k++){
                if(model().result_fit().terms[i].term[k].exp == 1)
                    output += " * " + model().result_fit().terms[i].term[k].name;
                else if(model().result_fit().terms[i].term[k].exp != 0)
                    output += " * " + "Math.pow(" + model().result_fit().terms[i].term[k].name + "," + model().result_fit().terms[i].term[k].exp + ")";
            }
            if(i != model().result_fit().terms.length-1)
                output += ") + ";
        }
        output += ");\n}";

        return output;
    }
}