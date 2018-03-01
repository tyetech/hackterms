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

function insertTermLinks(terms, thisTerm){            // inserts links to other terms into definitions

    if($(".definition-body").length > 0){      

        $(".definition-body").each(function(){                         // iterate through each definition

            var text = $(this).text();
            var preservedOriginalText = text;
            var tempText = text.toLowerCase();                         //this is the copy we're editing;
            var addedLinks = {};                                       // keep track of which links we've addedß

            for(var i = 0; i < terms.length; i++){                     // go through each term...
                
                if(terms[i] != null && terms[i] != thisTerm){          // if this term exists and isn't the main searched term...
                    
                    var term = terms[i].toLowerCase().replace(/[.,\/#!$%\^&\*;\+:{}=\-_`~()]/g,""); // get rid of special chars
                    var searchRegex = new RegExp("(^|\\W)" + term + "($|\\W)", "i");        // search for this term if it matches the whole word

                    // console.log(searchRegex);
                    
                    if(text.search(searchRegex) != -1){
                        
                        var startIndex = text.toLowerCase().indexOf(term);
                        var endIndex = startIndex + term.length;
                        var termOnPage = text.substring(startIndex, endIndex);              // this just tells us what word to replace with
                        console.log("term on page is: " + termOnPage);

                        // we need to get the index of every instance of that word on the page

                        var veryTempText = text;
                        var matchingIndexes = [];
                        var match = true;

                        while(match){
                            match = searchRegex.exec(veryTempText);         // is there a regex-ed term within our string?
                            if(match != null){
                                console.log(    searchRegex); 

                                if(tempText[match.index] == " "){
                                    match.index++;                      // if there is, replace it with spaces
                                }

                                veryTempText = replaceAt(veryTempText, match.index, Array(term.length + 1).join(" "));   //replace this word with spaces
                                matchingIndexes.push(match.index);
                            } else {
                                match = false;
                            }
                        }

                        matchingIndexes.reverse();

                        console.log("matchingIndexes for the term " + term);
                        console.log(matchingIndexes);

                        
                        if(matchingIndexes.length > 0){

                            for(var j = 0; j < matchingIndexes.length; j++){
                                console.log("current text: ");
                                console.log(tempText);
                                console.log("index: " + matchingIndexes[j]);
                                console.log(tempText[matchingIndexes[j]]);
                                if(tempText[matchingIndexes[j]] != "ಠ"){        // if this hasn't already been replaced...
                                    
                                    tempText = replaceAt(tempText, matchingIndexes[j], Array(term.length + 1 + 33).join("ಠ"));      // 33 is how much space the a tag takes up
                                    
                                    var termWithLink = "<a class = 'linked-term bold'>" + termOnPage + "</a>";
                                    text = replaceWith(text, matchingIndexes[j], termWithLink, term);

                                    console.log("new tempText");
                                    console.log(tempText);

                                    console.log("new text");
                                    console.log(text);

                                    $(this).html(text);
                                    if($(this).text() != preservedOriginalText){
                                        $(this).html(preservedOriginalText);        // if the text isn't equivalent to when we started, revert
                                    }
                                }
                            }

                        } else {
                            console.log("No matches");
                        }

                    } else {
                        console.log("did not find " + searchRegex);
                    }
                }
            }

            $(this).find("a").each(function(){
                $(this).attr("href", $(this).text()); 
            })


            console.log("======== done with this definition ==============");

        });

    } else {
        console.log("There are no definitions on the page");
    }
}

function replaceAt(text, index, replacement) {
    return text.substr(0, index) + replacement + text.substr(index + replacement.length);
}

function replaceWith(text, index, replacement, term){
    return text.substr(0, index) + replacement + text.substr(index + term.length, text.length)
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

    
