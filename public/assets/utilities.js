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

function insertTermLinks(terms, thisTerm){              // inserts links to other terms into definitions
                                                        // this is ugly as all hell, but it works well

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
                    var termLength = term.length;

                    // console.log(searchRegex);
                    
                    if(text.search(searchRegex) != -1){
                        
                        var startIndex = text.toLowerCase().indexOf(term);
                        var endIndex = startIndex + term.length;
                        var termOnPage = text.substring(startIndex, endIndex);              // this just tells us what word to replace with
                        //console.log("term on page is: " + termOnPage);

                        // we need to get the index of every instance of that word on the page

                        var veryTempText = text;
                        var matchingIndexes = [];
                        var match = true;

                        while(match){
                            match = searchRegex.exec(veryTempText);         // is there a regex-ed term within our string?
                            if(match != null){
                                console.log(searchRegex); 
                                var tempTermLength = termLength;
                                console.log("tempText[match.index]: " + tempText[match.index]);

                                if(text[match.index] == " "){
                                    console.log("THIS IS A SPACE! Incrementing");
                                    match.index++;                      // if there is, replace it with spaces
                                    tempTermLength++;
                                    //console.log(tempText[match.index]);
                                }



                                veryTempText = replaceWith(veryTempText, match.index, Array(tempTermLength + 1).join(" "), tempTermLength);   //replace this word with spaces
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

                                console.log("on page HTML");
                                console.log(text);
                                console.log("current text: ");
                                console.log(tempText);
                                console.log("index: " + matchingIndexes[j]);
                                console.log("letter at tempText: " + tempText[matchingIndexes[j]]);

                                if(tempText[matchingIndexes[j]] != "ಠ"){        // if this hasn't already been replaced...
                                    
                                    var termWithLink = "<a class = 'linked-term bold'>" + termOnPage + "</a>";
                                    tempText = replaceWith(tempText, matchingIndexes[j], Array(termWithLink.length).join("ಠ"), termLength);      // 33 is how much space the a tag takes up
                                    text = replaceWith(text, matchingIndexes[j], termWithLink, termLength);

                                    console.log("new tempText");
                                    console.log(tempText);

                                    console.log("new text");
                                    console.log(text);

                                    $(this).html(text);
/*                                    if($(this).text() != preservedOriginalText){
                                        console.log("reverting");
                                        $(this).html(preservedOriginalText);        // if the text isn't equivalent to when we started, revert
                                    }*/
                                }
                            }

                        } else {
                            console.log("No matches");
                        }

                    } 
                }
            }
            // after all the links are set up, cycle through each one and add the actual href attributes
            $(this).find("a").each(function(){
                $(this).attr("href", $(this).text()); 
            })


//            console.log("======== done with this definition ==============");

        });

    } else {
        console.log("There are no definitions on the page");
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

    
