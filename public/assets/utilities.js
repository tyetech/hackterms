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




function insertTermLinks(terms, thisTerm){
    if($(".definition-body").length > 0){  
        $(".definition-body").each(function(){                         // iterate through each definition on the page
            var text = $(this).text();
            var copy = text;
            var htmlCopy = text;
            var ignoredTerms = ["if", "when", "else", "then"]


            
            terms.forEach(function(term){      // iterate through each term
                if(term.length > 3 && term.toLowerCase() != thisTerm.toLowerCase() && ignoredTerms.indexOf(term.toLowerCase()) == -1){          // if the term isn't blank and isn't the same as the term card
                    var matchIndex = copy.toLowerCase().indexOf(term.toLowerCase());        // where is the term in the copy?  
                    if(matchIndex != -1 && term != thisTerm){


                        // let's check if this is a whole word
                        var startIndex = matchIndex;
                        var endIndex = matchIndex + term.length - 1;

                        if( (copy[startIndex-1] == " " || startIndex == 0) && (copy[endIndex+1] == " " || endIndex == (copy.length-1) )  ){

                            //console.log("Found a match for [" + term.toLowerCase() + "] at char " + copy.indexOf(term));                        
                        
                            if(htmlCopy[matchIndex] == " "){
                            //    console.log("GOT A SPACE");
                                matchIndex++;
                                copy = copy.slice(0, matchIndex) + Array(term.length +33).join("ಠ") + copy.slice( (matchIndex + term.length) , copy.length );    // 32 is the length of <a href = ''></a>
                                htmlCopy = htmlCopy.slice(0, matchIndex) + "<a class='linked-term bold'>" + term + "</a>" + htmlCopy.slice( (matchIndex + term.length) , htmlCopy.length)
                                
                            } else {
                                copy = copy.slice(0, matchIndex) + Array(term.length + 32).join("ಠ") + copy.slice( (matchIndex + term.length) , copy.length );    // 32 is the length of <a href = ''></a>
                                htmlCopy = htmlCopy.slice(0, matchIndex) + "<a class='linked-term bold'>" + term + "</a>" + htmlCopy.slice( (matchIndex + term.length) , htmlCopy.length)
                            }    
                                /*  
                                console.log("The new copy is: " + copy);
                                console.log("The new html is: " + htmlCopy);
                                */
                        } else {
                            console.log(term + " is not a whole word");
                        }
                    }
                } else {
                    //console.log("NOT testing " + term);
                }
            })

            $(this).html(htmlCopy);


            // after all the links are set up, cycle through each one and add the actual href attributes
            $(this).find("a").each(function(){
                $(this).attr("href", $(this).text()); 
            })
            // console.log("========");
        });
    }
}


function replaceAt(text, index, replacement) {
    return text.substr(0, index) + replacement + text.substr(index + replacement.length);
}

function replaceWith(text, index, replacement, termLength){
    return text.substr(0, index) + replacement + text.substr(index + termLength, text.length)
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

    
