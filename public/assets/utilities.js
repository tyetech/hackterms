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
        for(key in relatedTerms){                                   // for each key...

            if (relatedTerms[key] >= mostFrequentTermCount) {
                mostFrequentTermCount = relatedTerms[key];
                currentTopKey = key;
            }
        }

        delete relatedTerms[currentTopKey];                   // remove that key from the object
        termsInOrder.push(currentTopKey)
    
        console.log(termsInOrder);

        if(j == objectLength - 1){
            for(var k = 0; k < termsInOrder.length; k++){
                console.log(termsInOrder[k]);
                var link = "/" + termsInOrder[k]
                $("#related-terms-section").append('<a href = "' + link + '" class= "related-term">' + termsInOrder[k] + "</a>");
            }
        }

    }   

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