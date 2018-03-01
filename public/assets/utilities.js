function frequencyCount(array){
    var hashTable = {}

    for(var i = 0; i<array.length; i++){
        var item = array[i],
            itemCount = (hashTable[item] ? hashTable[item] : 0);

        if (!item.length){ continue; }
        hashTable[item] = itemCount + 1;

    }

    console.log(hashTable);

    return hashTable;
}

function sortKeysByFrequency(array) {
    var sortedObject = frequencyCount(array),
        newTermsArray = Object.keys(sortedObject);
        
        var sortedArray = newTermsArray.sort(function(item) { return sortedObject[item] });
        console.log(sortedArray);

    return  sortedArray;
}
                                                 // remove when I make sense of the code above
function sortRelatedTerms(terms){                // messy solution to sorting an array in order of frequency

    relatedTerms = {};

    for(var i = 0; i<terms.length; i++){
        var term = terms[i];

        if(typeof(relatedTerms[term]) == "undefined"){
            relatedTerms[term] = 1;
        } else {
            relatedTerms[term]++;
        }
    }


    var termsInOrder = [];
    var mostFrequentTermCount;
    var currentTopKey = "";
    var objectLength = Object.keys(relatedTerms).length;

    for(var j = 0; j < objectLength; j++){         // cycle through as many times as there are keys
        mostFrequentTermCount = 0;
        for(var key in relatedTerms){                                   // for each key...

            if (relatedTerms[key] >= mostFrequentTermCount) {
                mostFrequentTermCount = relatedTerms[key];
                currentTopKey = key;
            }
        }

        delete relatedTerms[currentTopKey];                   // remove that key from the object
        termsInOrder.push(currentTopKey)

        if(j == objectLength - 1){
            for(var k = 0; k < termsInOrder.length; k++){
                $("#related-terms-section").append("<a class= 'related-term'>" + termsInOrder[k] + "</a>");
                $(".related-term").last().attr("href", termsInOrder[k])
            }
        }

    }   

}

function insertTermLinks(terms){            // inserts links to other terms into definitions

    if($(".definition-body").length > 0){      // iterate through each definition

        $(".definition-body").each(function(){

            var thisTerm = $(this).parent().parent().parent().find(".definition-term").text();

            var text = $(this).text();
            var tempText = text;            // we'll need to edit this copy;

            for(var i = 0; i < terms.length; i++){                     // go through each term...
                
                var term = terms[i];
                
                if(term != null && term != thisTerm && tempText.toLowerCase().indexOf(term.toLowerCase()) != -1){

                    var startIndex = text.toLowerCase().indexOf(term.toLowerCase());
                    var endIndex = startIndex + term.length;

                    var termWithLink = "<a class = 'linked-term bold'>" + text.substring(startIndex, endIndex) + "</a>";
                    text = text.replace(new RegExp(term, "ig"), termWithLink);
                    
                    tempText = tempText.toLowerCase().replace(new RegExp(term, "ig"), "");         // make sure we don't look for this anymore
                    $(this).html(text);
                    $(".linked-term").last().attr("href", term);
                }
            }

            //console.log("======================");

        });

    } else {
        console.log("There are no definitions on the page");
    }
}

function replaceAt(text, index, replacement) {
    return text.substr(0, index) + replacement+ text.substr(index + replacement.length);
}


function cleanUrl(text){

    text = text.split("%").join("%25");
    text = text.split(" ").join("%20");
    text = text.split("$").join("%24");
    text = text.split("&").join("%26");
    text = text.split("`").join("%60");
    text = text.split(":").join("%3A");
    text = text.split("<").join("%3C");
    text = text.split(">").join("%3E");
    text = text.split("[").join("%5B");
    text = text.split("]").join("%5D");
    text = text.split("+").join("%2B");
    text = text.split("#").join("%23");
    text = text.split("@").join("%40");
    text = text.split("/").join("%2F");

    return text;

}